from PIL import Image, ImageDraw

def make_icon(size, path):
    img = Image.new('RGBA', (size, size), (10, 22, 40, 255))
    d = ImageDraw.Draw(img)
    margin = int(size * 0.08)
    corner = int(size * 0.2)
    d.rounded_rectangle([margin, margin, size - margin, size - margin], radius=corner, fill=(15, 41, 66, 255), outline=(201, 169, 97, 255), width=max(2, int(size * 0.015)))
    box_size = size - margin * 2
    rail_x = margin + int(box_size * 0.12)
    rail_y1 = margin + int(box_size * 0.22)
    rail_y2 = size - margin - int(box_size * 0.12)
    rail_w = int(box_size * 0.04)
    d.rounded_rectangle([rail_x, rail_y1, rail_x + rail_w, rail_y2], radius=rail_w // 2, fill=(201, 169, 97, 255))
    frame_x1 = rail_x + rail_w + int(box_size * 0.04)
    frame_x2 = size - margin - int(box_size * 0.12)
    frame_y1, frame_y2 = rail_y1, rail_y2
    d.rounded_rectangle([frame_x1, frame_y1, frame_x2, frame_y2], radius=int(box_size * 0.05), fill=(10, 22, 40, 255), outline=(44, 74, 110, 255), width=max(1, int(size * 0.01)))
    n = 8
    total_h = frame_y2 - frame_y1
    slat_h = total_h / n
    pad = slat_h * 0.15
    for i in range(n):
        y1 = frame_y1 + i * slat_h + pad
        y2 = frame_y1 + (i + 1) * slat_h - pad
        color = (61, 90, 128, 255) if i % 2 == 0 else (69, 106, 148, 255)
        d.rounded_rectangle([frame_x1 + pad, y1, frame_x2 - pad, y2], radius=int(slat_h * 0.2), fill=color)
    motor_w = int(box_size * 0.3)
    motor_h = int(box_size * 0.08)
    motor_x1 = (frame_x1 + frame_x2 - motor_w) // 2
    motor_x2 = motor_x1 + motor_w
    motor_y1 = frame_y1 - motor_h - int(box_size * 0.02)
    motor_y2 = motor_y1 + motor_h
    d.rounded_rectangle([motor_x1, motor_y1, motor_x2, motor_y2], radius=motor_h // 2, fill=(201, 169, 97, 255))
    img.save(path, 'PNG')
    print(f'OK: {path}')

make_icon(192, 'icon-192.png')
make_icon(512, 'icon-512.png')
make_icon(180, 'apple-touch-icon.png')
