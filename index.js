const express = require('express');
const axios = require('axios');
const app = express();

// Cấu hình nhận dữ liệu dung lượng lớn (PDF blob/Base64) từ Google Apps Script
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Endpoint nhận request POST tại đường dẫn gốc '/'
app.post('/', async (req, res) => {
    try {
        const payloadFromSheets = req.body;
        
        console.log("=== [Yêu cầu mới] Nhận dữ liệu từ Google Sheets ===");
        console.log("Tên file nhận được:", payloadFromSheets.filename);

        // 1. TRẢ PHẢN HỒI NGAY LẬP TỨC CHO GOOGLE APPS SCRIPT ĐỂ TRÁNH LỖI TIMEOUT
        res.status(200).send("Server đã nhận file thành công và đang xử lý ngầm...");

        // 2. CHẠY NGẦM LOGIC XỬ LÝ (Không bắt Google Apps Script phải đứng đợi)
        setImmediate(async () => {
            try {
                const seatalkWebhookUrl = payloadFromSheets.webhook_url || '';
                
                if (!seatalkWebhookUrl) {
                    return console.error("[Lỗi chạy ngầm]: Thiếu URL Webhook của SeaTalk.");
                }

                // Cấu hình tin nhắn gửi sang SeaTalk 
                // (Hiện tại đang cấu hình gửi text báo cáo, bạn có thể bổ sung logic convert ảnh tại đây)
                const responseMessage = {
                    "tag": "text",
                    "text": {
                        "content": `📊 Báo cáo tự động\n- File: ${payloadFromSheets.filename || 'N/A'}\n- Trạng thái: Hệ thống đã tiếp nhận dữ liệu.`
                    }
                };

                // Tiến hành POST dữ liệu sang SeaTalk
                const seatalkRes = await axios.post(seatalkWebhookUrl, responseMessage, {
                    headers: { 'Content-Type': 'application/json' }
                });

                console.log(`[Chạy ngầm] Đã chuyển tiếp sang SeaTalk thành công cho file: ${payloadFromSheets.filename}`);
                console.log("[Phản hồi từ SeaTalk]:", seatalkRes.data);

            } catch (bgError) {
                console.error("[Lỗi xử lý ngầm]:", bgError.message);
                if (bgError.response) {
                    console.error("[Chi tiết lỗi từ SeaTalk]:", bgError.response.data);
                }
            }
        });

    } catch (error) {
        console.error("Lỗi xảy ra tại đầu nhận của Server:", error.message);
        // Kiểm tra nếu chưa trả phản hồi cho Google thì mới gửi lỗi về
        if (!res.headersSent) {
            return res.status(500).send("Lỗi Server: " + error.message);
        }
    }
});

// Chạy server ở cổng mặc định của hệ thống Render hoặc cổng 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy ổn định tại cổng: ${PORT}`);
});
