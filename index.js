const express = require('express');
const axios = require('axios');
const app = express();

// Cấu hình để server đọc dữ liệu JSON dung lượng lớn từ Google Apps Script gửi lên (ví dụ: ảnh, PDF blob)
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Endpoint nhận request POST tại đường dẫn gốc '/'
app.post('/', async (req, res) => {
    try {
        const payloadFromSheets = req.body;
        
        console.log("=== Đã nhận yêu cầu từ Google Sheets ===");
        
        // TRẢ PHẢN HỒI NGAY LẬP TỨC CHO GOOGLE APPS SCRIPT KHÔNG BỊ TIMEOUT
        res.status(200).send("Server đã nhận dữ liệu thành công và đang xử lý ngầm...");

        // CHẠY NGẦM LOGIC XỬ LÝ (Không bắt Google phải đợi nữa)
        setImmediate(async () => {
            try {
                const seatalkWebhookUrl = payloadFromSheets.webhook_url || '';
                if (!seatalkWebhookUrl) return console.error("Thiếu webhook SeaTalk");

                const responseMessage = {
                    "tag": "text",
                    "text": {
                        "content": `📊 Báo cáo tự động\n- Tên Sheet: ${payloadFromSheets.sheetName || 'N/A'}\n- Trạng thái: Xử lý hoàn tất.`
                    }
                };

                // Gửi sang SeaTalk
                await axios.post(seatalkWebhookUrl, responseMessage, {
                    headers: { 'Content-Type': 'application/json' }
                });
                console.log(`[Ngầm] Đã gửi thành công sheet: ${payloadFromSheets.sheetName}`);
            } catch (bgError) {
                console.error("[Lỗi chạy ngầm]:", bgError.message);
            }
        });

    } catch (error) {
        console.error("Lỗi Server:", error.message);
        if (!res.headersSent) {
            return res.status(500).send("Lỗi: " + error.message);
        }
    }
});

// Chạy server ở cổng mặc định của hệ thống hoặc cổng 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang hoạt động ổn định trên cổng: ${PORT}`);
});
