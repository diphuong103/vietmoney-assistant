-- ═══════════════════════════════════════════════════════════
-- Seed Data for VietMoney Assistant (H2 / Dev mode)
-- ═══════════════════════════════════════════════════════════

-- ── Tourist Spots ─────────────────────────────────────────
INSERT INTO tourist_spots (name, city, province, address, description, image_url, latitude, longitude, rating, ticket_price, open_hours, category)
VALUES
('Phố Cổ Hội An', 'Hội An', 'Quảng Nam', '180 Trần Phú, Hội An', 'Khu phố cổ được UNESCO công nhận, nổi tiếng với kiến trúc cổ, đèn lồng và ẩm thực đường phố.', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400', 15.8801, 108.3380, 4.8, '120,000đ', '08:00 – 21:00', 'heritage'),
('Vịnh Hạ Long', 'Hạ Long', 'Quảng Ninh', 'Bến tàu Hạ Long', 'Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi tuyệt đẹp trên biển.', 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400', 20.9101, 107.1839, 4.9, '250,000đ – 500,000đ', '06:00 – 18:00', 'nature'),
('Chùa Một Cột', 'Hà Nội', 'Hà Nội', 'Phố Chùa Một Cột, Ba Đình', 'Ngôi chùa biểu tượng với kiến trúc duy nhất trên một cột đá giữa hồ sen.', 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400', 21.0359, 105.8340, 4.5, 'Miễn phí', '07:00 – 18:00', 'temple'),
('Bà Nà Hills', 'Đà Nẵng', 'Đà Nẵng', 'Hoà Ninh, Hoà Vang', 'Khu du lịch trên đỉnh núi nổi tiếng với Cầu Vàng và cáp treo dài nhất thế giới.', 'https://images.unsplash.com/photo-1565953603397-22e98f1fc5d5?w=400', 15.9977, 107.9951, 4.6, '900,000đ', '07:00 – 22:00', 'entertainment'),
('Cù Lao Chàm', 'Hội An', 'Quảng Nam', 'Đảo Cù Lao Chàm', 'Quần đảo sinh thái với bãi biển trong xanh, lặn ngắm san hô và ẩm thực hải sản.', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400', 15.9600, 108.5100, 4.4, '70,000đ phí vào đảo', '06:00 – 17:00', 'nature'),
('Đường Hầm Đất Sét', 'Đà Lạt', 'Lâm Đồng', '19 Trần Phú, P.3', 'Công trình nghệ thuật độc đáo bằng đất sét, tái hiện các biểu tượng văn hóa Việt Nam.', 'https://images.unsplash.com/photo-1555921015-5532091f6026?w=400', 11.9404, 108.4583, 4.2, '50,000đ', '07:30 – 17:00', 'art'),
('Phú Quốc Vinpearl Safari', 'Phú Quốc', 'Kiên Giang', 'Gành Dầu, Phú Quốc', 'Vườn thú bán hoang dã lớn nhất Việt Nam với hơn 3,000 động vật từ khắp thế giới.', 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=400', 10.4090, 103.8560, 4.7, '650,000đ', '09:00 – 16:00', 'entertainment'),
('Thánh Địa Mỹ Sơn', 'Duy Xuyên', 'Quảng Nam', 'Duy Phú, Duy Xuyên', 'Di sản thế giới UNESCO — quần thể đền tháp Chăm Pa cổ từ thế kỷ IV.', 'https://images.unsplash.com/photo-1580309237429-5ee3c2e02e1e?w=400', 15.7624, 108.1212, 4.5, '150,000đ', '06:30 – 17:00', 'heritage');

-- ── City Price Wiki ───────────────────────────────────────
INSERT INTO city_price_wikis (city, category, item, min_price, max_price, unit, note) VALUES
('Hà Nội',      'food',      'Phở bò',              '30000',  '60000',  'VND/tô',    'Phổ biến nhất cho bữa sáng'),
('Hà Nội',      'food',      'Bún chả',             '40000',  '70000',  'VND/suất',  'Đặc sản Hà Nội'),
('Hà Nội',      'food',      'Bánh mì',             '15000',  '35000',  'VND/ổ',     'Street food phổ biến'),
('Hồ Chí Minh', 'food',      'Cơm tấm',            '35000',  '70000',  'VND/đĩa',   'Bữa trưa yêu thích'),
('Hồ Chí Minh', 'food',      'Hủ tiếu',             '30000',  '55000',  'VND/tô',    'Đặc sản miền Nam'),
('Đà Nẵng',     'food',      'Mì Quảng',            '25000',  '50000',  'VND/tô',    'Đặc sản Quảng Nam'),
('Hội An',      'food',      'Cao Lầu',             '35000',  '60000',  'VND/tô',    'Chỉ có ở Hội An'),
('Hà Nội',      'drink',     'Cà phê sữa đá',      '20000',  '50000',  'VND/ly',    'Café vỉa hè văn hóa'),
('Hồ Chí Minh', 'drink',     'Trà sữa',             '35000',  '65000',  'VND/ly',    'Phổ biến cho giới trẻ'),
('Đà Nẵng',     'drink',     'Nước dừa tươi',       '15000',  '30000',  'VND/quả',   'Giải khát mùa hè'),
('Hà Nội',      'transport', 'Xe ôm / Grab Bike',   '15000',  '40000',  'VND/km',    'Phương tiện linh hoạt'),
('Hồ Chí Minh', 'transport', 'Grab Car',            '50000',  '120000', 'VND/chuyến', 'Tiện lợi, có máy lạnh'),
('Đà Nẵng',     'transport', 'Xe buýt',             '5000',   '10000',  'VND/lượt',  'Rẻ nhất cho di chuyển'),
('Hà Nội',      'hotel',     'Hostel dorm bed',     '150000', '300000', 'VND/đêm',   'Budget-friendly'),
('Hồ Chí Minh', 'hotel',     'Khách sạn 3 sao',    '500000', '1200000','VND/đêm',   'Thoải mái, tiện nghi'),
('Đà Nẵng',     'hotel',     'Resort ven biển',     '1500000','4000000','VND/đêm',   'View biển, hồ bơi'),
('Hội An',      'shopping',  'Áo dài may đo',       '500000', '1500000','VND/bộ',    'Đặc sản Hội An'),
('Hà Nội',      'shopping',  'Nam châm/keyring',    '20000',  '50000',  'VND/cái',   'Quà lưu niệm phổ biến'),
('Hội An',      'tour',      'Tour Cù Lao Chàm',   '400000', '800000', 'VND/người', 'Lặn ngắm san hô'),
('Hạ Long',     'tour',      'Cruise 1 ngày',       '1200000','3500000','VND/người', 'Ngắm vịnh + kayak');
