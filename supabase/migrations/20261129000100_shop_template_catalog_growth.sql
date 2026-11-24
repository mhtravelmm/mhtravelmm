-- Plan §4 order and count: grow the hotel category to ten paid designs, then
-- give restaurant, cafe, attraction and book shop one paid alternative each.
-- The trigger from 20261128000100 refuses any row that differs from every live
-- template of its category on fewer than four of the seven axes, so these rows
-- are the same catalog `seedTemplates()` holds in `src/lib/shopTemplates.ts`.

insert into public.shop_templates
  (id, category, name_mm, name_en, version, status, preview_image_key, price_mmk_month, is_free, traits)
values
  ('hotel_split_screen', 'hotel', 'မျက်နှာပြင် ကွဲ', 'Split Screen', 1, 'active',
   'templates/hotel-split-screen.webp', 2000, false,
   '{"layout":"fixed_frame","navigation":"icon_rail","hero":"fixed_half_screen","catalog":"accordion","bookingCta":"header_button","gallery":"fixed_panel","mobile":"icon_rail"}'),
  ('hotel_board', 'hotel', 'ကြော်ငြာဘုတ်', 'Board', 1, 'active',
   'templates/hotel-board.webp', 2000, false,
   '{"layout":"tile_grid","navigation":"masthead","hero":"banded_banner","catalog":"bordered_tiles","bookingCta":"full_width_strip","gallery":"grid_inside_tile","mobile":"stacked_tiles"}'),
  ('hotel_panorama', 'hotel', 'မြင်ကွင်းကျယ်', 'Panorama', 1, 'active',
   'templates/hotel-panorama.webp', 2000, false,
   '{"layout":"full_bleed_stack","navigation":"underline_tabs","hero":"full_screen_overlay","catalog":"comparison_matrix","bookingCta":"pinned_bottom_bar","gallery":"edge_to_edge_scroll","mobile":"full_screen"}'),
  ('hotel_directory', 'hotel', 'လမ်းညွှန်', 'Directory', 1, 'active',
   'templates/hotel-directory.webp', 2000, false,
   '{"layout":"labelled_rows","navigation":"none","hero":"no_hero","catalog":"dotted_leader_list","bookingCta":"end_of_entry","gallery":"inline_strip","mobile":"labelled_rows"}'),
  ('restaurant_menu_board', 'restaurant', 'မီနူး ဘုတ်', 'Menu Board', 1, 'active',
   'templates/restaurant-menu-board.webp', 2000, false,
   '{"layout":"menu_columns","navigation":"dark_header","hero":"no_hero","catalog":"leader_lines","bookingCta":"table_request_strip","gallery":"inline_strip","mobile":"single_column_menu"}'),
  ('cafe_photo_grid', 'cafe', 'ဓာတ်ပုံ ဇယား', 'Photo Grid', 1, 'active',
   'templates/cafe-photo-grid.webp', 2000, false,
   '{"layout":"photo_wall","navigation":"none","hero":"tiled_collage","catalog":"chip_grid","bookingCta":"quiet_text_link","gallery":"tiled_wall","mobile":"stacked_collage"}'),
  ('attraction_ticket', 'attraction', 'လက်မှတ်', 'Ticket', 1, 'active',
   'templates/attraction-ticket.webp', 2000, false,
   '{"layout":"numbered_sequence","navigation":"fact_strip","hero":"full_width_overlay","catalog":"numbered_steps","bookingCta":"ticket_line","gallery":"grid_thumbnails","mobile":"stacked_sequence"}'),
  ('book_shop_shelf', 'book_shop', 'စာအုပ်စင်', 'Shelf', 1, 'active',
   'templates/book-shop-shelf.webp', 2000, false,
   '{"layout":"sidebar_and_list","navigation":"sticky_sidebar","hero":"no_hero","catalog":"spine_rows","bookingCta":"sidebar_button","gallery":"inline_strip","mobile":"sidebar_collapsed"}')
on conflict (id) do nothing;
