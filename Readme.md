# QR Order System

Hệ thống gọi món bằng mã QR cho nhà hàng/quán ăn, gồm:
- Khách hàng quét QR theo bàn để xem menu và đặt món.
- Nhân viên/Bếp theo dõi, xử lý trạng thái đơn hàng.
- Admin quản lý danh mục, món ăn, bàn, người dùng, đơn hàng, thanh toán và thống kê.

## Mô tả dự án

Dự án gồm 2 phần chính:

- `Backend`:
  - API server xây dựng bằng Express.
  - Kết nối MongoDB để lưu dữ liệu.
  - Xử lý xác thực JWT, đơn hàng, thanh toán, quản trị và các nghiệp vụ liên quan.
- `frontend`:
  - Ứng dụng React + Vite cho giao diện khách hàng, nhân viên, bếp và admin.
  - Gọi API thông qua `/api` (proxy về backend trong môi trường local).

## Công nghệ sử dụng

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JSON Web Token (`jsonwebtoken`)
- `bcryptjs`
- `multer`
- `cors`, `morgan`, `dotenv`

### Frontend
- React 18
- Vite
- React Router DOM
- Tailwind CSS
- Chart.js + react-chartjs-2
- qrcode.react
- lucide-react

## Hướng dẫn cài đặt và chạy project

### 1) Yêu cầu môi trường
- Node.js >= 18
- npm >= 9
- MongoDB local hoặc MongoDB Atlas

### 2) Clone project

```bash
git clone https://github.com/bombombip12-design/QR-Order-System.git
cd QR-Order-System
```

### 3) Cài đặt dependencies

#### Backend

```bash
cd Backend
npm install
```

#### Frontend

```bash
cd ../frontend
npm install
```

### 4) Cấu hình biến môi trường cho Backend

Tạo file `Backend/.env` (nếu chưa có), ví dụ:

```env
MONGO_URI=mongodb://localhost:27017/food_order_qr
PORT=5000
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173

# (Tùy chọn) thông tin thanh toán demo
PAYMENT_MOMO_QR=
PAYMENT_MOMO_NAME=
PAYMENT_MOMO_PHONE=
PAYMENT_BANK_NAME=
PAYMENT_BANK_ACCOUNT_NAME=
PAYMENT_BANK_ACCOUNT_NUMBER=
```

### 5) Chạy project

Mở 2 terminal:

#### Terminal 1 - Backend

```bash
cd Backend
npm run dev
```

Backend chạy tại: `http://localhost:5000`

#### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

Frontend chạy tại: `http://localhost:5173`

> Frontend đã cấu hình proxy `/api` và `/uploads` về `http://localhost:5000`.

### 6) Scripts hữu ích

#### Backend

```bash
npm run dev          # Chạy development với nodemon
npm start            # Chạy production
npm run seed         # Seed dữ liệu mẫu
npm run seed:tables  # Seed dữ liệu bàn mẫu
```

#### Frontend

```bash
npm run dev
npm run build
npm run preview
```

## Ghi chú

- Đảm bảo MongoDB đã chạy trước khi start backend.
- Không commit file `.env` chứa thông tin thực tế lên GitHub.
- Khi deploy production, cần cấu hình lại CORS, domain frontend/backend và biến môi trường phù hợp.
