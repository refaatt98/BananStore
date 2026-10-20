-- طلب مسبق: منتج بيقبل طلبات لما تخلص الكمية

alter table public.products add column if not exists preorder boolean not null default false;
alter table public.order_items add column if not exists preorder boolean not null default false;

-- حالة "طلب مسبق" بعد "جديد" مباشرة
update public.order_statuses set sort = sort + 1 where sort >= 1 and key <> 'preorder';
insert into public.order_statuses (key, label, color, sort, active, is_system, customer_message)
values ('preorder', 'طلب مسبق', '#c98f86', 1, true, true,
  E'مرحبا {name} 🤍\nمعك متجر بَنان بخصوص طلبك المسبق *{number}*\nوصلنا طلبك، ورح نأكّد معك موعد التجهيز قريباً.')
on conflict (key) do nothing;

CREATE OR REPLACE FUNCTION public.place_order(payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  s public.settings;
  z public.delivery_zones;
  it jsonb;
  p public.products;
  v_qty int;
  v_pre boolean;
  v_any_pre boolean := false;
  v_subtotal numeric := 0;
  v_fee numeric := 0;
  v_gift numeric := 0;
  v_discount numeric := 0;
  v_promo record;
  v_order public.orders;
  v_name text := btrim(coalesce(payload->>'name', ''));
  v_phone text := regexp_replace(coalesce(payload->>'phone', ''), '[\s-]', '', 'g');
  v_items jsonb := coalesce(payload->'items', '[]'::jsonb);
begin
  if char_length(v_name) < 2 or char_length(v_name) > 80 then raise exception 'الاسم غير صحيح'; end if;
  if v_phone !~ '^(\+?970|\+?972|0)5[0-9]{8}$' then raise exception 'رقم الجوال غير صحيح'; end if;
  if jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 or jsonb_array_length(v_items) > 40 then raise exception 'السلة فاضية'; end if;

  select * into s from public.settings where id = 1;
  select * into z from public.delivery_zones where id = (payload->>'zone_id')::uuid and active;
  if not found then raise exception 'اختاري منطقة التوصيل'; end if;
  if not z.is_pickup and (char_length(btrim(coalesce(payload->>'city',''))) < 2 or char_length(btrim(coalesce(payload->>'address',''))) < 3) then
    raise exception 'العنوان ناقص';
  end if;

  for it in select * from jsonb_array_elements(v_items) loop
    v_qty := greatest(least(coalesce((it->>'qty')::int, 1), 50), 1);
    select * into p from public.products where id = (it->>'product_id')::uuid and active for update;
    if not found then raise exception 'في قطعة بالسلة مش متوفرة'; end if;
    if p.stock is not null and p.stock < v_qty then
      if p.preorder then
        v_any_pre := true;
      else
        raise exception 'الكمية المطلوبة من "%" مش متوفرة (المتوفر %)', p.name, p.stock;
      end if;
    end if;
    v_subtotal := v_subtotal + p.price * v_qty;
  end loop;

  v_fee := case when z.is_pickup then 0 when s.free_delivery_over is not null and v_subtotal >= s.free_delivery_over then 0 else z.fee end;
  v_gift := case when coalesce((payload->>'gift_wrap')::boolean, false) then s.gift_wrap_price else 0 end;

  select * into v_promo from public._eval_promo(payload->>'promo_code', v_subtotal, v_fee);
  if coalesce(btrim(payload->>'promo_code'), '') <> '' and not v_promo.valid then
    raise exception '%', v_promo.message;
  end if;
  if v_promo.valid then
    if v_promo.free_delivery then v_fee := 0; else v_discount := v_promo.discount; end if;
    update public.promo_codes set used_count = used_count + 1 where code = v_promo.code;
  end if;

  insert into public.orders (customer_name, phone, zone_id, zone_name, is_pickup, city, address, notes, gift_wrap, gift_message,
    subtotal, delivery_fee, gift_wrap_fee, discount, promo_code, total, status)
  values (v_name, v_phone, z.id, z.name, z.is_pickup,
    left(btrim(coalesce(payload->>'city','')), 80), left(btrim(coalesce(payload->>'address','')), 300),
    nullif(left(btrim(coalesce(payload->>'notes','')), 1000), ''),
    coalesce((payload->>'gift_wrap')::boolean, false), nullif(left(btrim(coalesce(payload->>'gift_message','')), 300), ''),
    v_subtotal, v_fee, v_gift, v_discount, v_promo.code, greatest(v_subtotal + v_fee + v_gift - v_discount, 0),
    case when v_any_pre then 'preorder' when z.is_pickup then 'pickup' else 'new' end)
  returning * into v_order;

  for it in select * from jsonb_array_elements(v_items) loop
    v_qty := greatest(least(coalesce((it->>'qty')::int, 1), 50), 1);
    select * into p from public.products where id = (it->>'product_id')::uuid;
    v_pre := p.stock is not null and p.stock < v_qty;
    insert into public.order_items (order_id, product_id, name, image, art, price, qty, color, size, note, preorder)
    values (v_order.id, p.id, p.name, p.images[1], p.art, p.price, v_qty,
      case when jsonb_typeof(it->'color') = 'object' then jsonb_build_object('name', left(it->'color'->>'name', 40), 'hex', left(it->'color'->>'hex', 9)) end,
      nullif(left(coalesce(it->>'size',''), 40), ''), nullif(left(btrim(coalesce(it->>'note','')), 120), ''), v_pre);
    -- قطعة الطلب المسبق ما بتنقص من المخزون (بيضل صفر)
    if p.stock is not null and not v_pre then
      update public.products set stock = stock - v_qty where id = p.id;
    end if;
  end loop;

  return public.get_order(v_order.id);
end $function$;

CREATE OR REPLACE FUNCTION public.on_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_events (order_id, status) values (new.id, new.status);
  end if;
  -- قطع الطلب المسبق ما نقصت من المخزون، فما بترجع إله
  if tg_op = 'UPDATE' and new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.products p set stock = p.stock + i.qty from public.order_items i
      where i.order_id = new.id and i.product_id = p.id and p.stock is not null and not i.preorder;
  elsif tg_op = 'UPDATE' and old.status = 'cancelled' and new.status <> 'cancelled' then
    update public.products p set stock = greatest(p.stock - i.qty, 0) from public.order_items i
      where i.order_id = new.id and i.product_id = p.id and p.stock is not null and not i.preorder;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.get_order(p_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object(
    'id', o.id, 'number', o.number, 'status', o.status, 'name', o.customer_name, 'phone', o.phone,
    'zone_name', o.zone_name, 'is_pickup', o.is_pickup, 'city', o.city, 'address', o.address, 'notes', o.notes,
    'gift_wrap', o.gift_wrap, 'gift_message', o.gift_message,
    'subtotal', o.subtotal, 'delivery_fee', o.delivery_fee, 'gift_wrap_fee', o.gift_wrap_fee,
    'discount', o.discount, 'promo_code', o.promo_code, 'total', o.total, 'created_at', o.created_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object('name', i.name, 'price', i.price, 'qty', i.qty, 'color', i.color, 'size', i.size, 'note', i.note, 'image', i.image, 'art', i.art, 'preorder', i.preorder)) from public.order_items i where i.order_id = o.id), '[]'::jsonb)
  ) from public.orders o where o.id = p_id;
$function$;
