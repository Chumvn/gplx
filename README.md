# GPLX 2026 – Luyện Thi Bằng Lái Xe

Ứng dụng web tĩnh luyện thi 600 câu hỏi GPLX (Bộ Công An 2025), triển khai trên GitHub Pages.

## Tính năng

- 📖 **Ôn tập theo chủ đề** – 6 chương + câu hỏi điểm liệt
- 📝 **Thi thử** – Sát hạch A1, B, C1 với đếm ngược thời gian
- 🔥 **60 câu điểm liệt** – Đánh dấu riêng, sai 1 câu = trượt
- ⭐ **Đánh dấu câu hỏi** – Bookmark để ôn lại
- ❌ **Xem lại câu sai** – Tập trung vào điểm yếu
- 📊 **Thống kê tiến độ** – Lưu trên localStorage
- 🌙 **Dark/Light mode** – Mặc định Dark, lưu cài đặt
- 📱 **PWA & Offline** – Cài đặt như app, dùng offline

## Triển khai

1. Push repo lên GitHub
2. Settings → Pages → Deploy from main branch
3. Truy cập `https://<username>.github.io/<repo>/`

## Công nghệ

- Vanilla HTML/CSS/JS – Không framework, không build tools
- PWA (Service Worker + Manifest)
- Dark Neumorphism Hybrid UI
- localStorage cho progress & settings
