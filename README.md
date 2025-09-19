# Backend (Node.js/Express) - LuckyHeng Grocery

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MySQL database

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Set up environment variables:**
   - Copy `.env.example` to `.env` andกรอกค่าตามที่ต้องการ
3. **Configure database:**
   - แก้ไข `config/config.json` ให้ตรงกับ MySQL ของคุณ
   - รัน migration ถ้ามี

### Running the Backend
```bash
npm run dev
```

### Environment Variables
ดูตัวอย่างใน `.env.example`

### Project Structure
```
server/
├── src/
├── config/
├── uploads/
├── package.json
├── .env.example
└── README.md
```

### Features
- RESTful API สำหรับ grocery app
- JWT authentication
- รองรับการอัปโหลดไฟล์
- ระบบฐานข้อมูล MySQL

### ติดต่อผู้พัฒนา
[ใส่อีเมลหรือช่องทางติดต่อ]
