const express = require('express');
const axios = require('axios');
const app = express();

// Cấu hình để server đọc dữ liệu JSON dung lượng lớn từ Google Apps Script gửi lên (ví dụ: ảnh, PDF blob)
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Endpoint nhận request POST tại đường dẫn gốc '/'
app.post('/', async (req, res) => {
    try {
        // Lấy dữ liệu do Google Apps Script gửi lên
        const payloadFromSheets = req.body;
        
        console.log("=== Nhận dữ liệu thành công từ Google Sheets ===");
        console.log("Tên Sheet:", payloadFromSheets.sheetName);

        // Lấy URL Webhook của SeaTalk từ dữ liệu gửi lên
        // Nếu trong file script của bạn chưa truyền qua, hãy thay link webhook trực tiếp vào chuỗi trống ở dưới
        const seatalkWebhookUrl = payloadFromSheets.webhookUrl || '';

        if (!seatalkWebhookUrl) {
            console.error("Lỗi: Thiếu cấu hình URL Webhook của SeaTalk!");
            return res.status(400).json({ error: "Missing SeaTalk Webhook URL" });
        }

        // CẤU TRÚC TIN NHẮN GỬI SANG SEATALK
        // Tùy theo kịch bản bạn muốn gửi text hay định dạng khác. Dưới đây là cấu hình gửi tin nhắn văn bản mẫu:
        const responseMessage = {
            "tag": "text",
            "text": {
                "content": `📊 Báo cáo tự động\n- Tên Sheet: ${payloadFromSheets.sheetName || 'N/A'}\n- Trạng thái: Xử lý dữ liệu hoàn tất.`
            }
        };

        // Tiến hành gửi tiếp (Forward) dữ liệu sang SeaTalk
        const seatalkRes = await axios.post(seatalkWebhookUrl, responseMessage, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log("Phản hồi từ SeaTalk:", seatalkRes.data);

        // Trả về thông báo thành công cho Google Apps Script nhận biết
        return res.status(200).send("Gửi dữ liệu sang SeaTalk thành công!");

    } catch (error) {
        console.error("Lỗi xảy ra tại Server:", error.message);
        if (error.response) {
            console.error("Chi tiết lỗi từ phía SeaTalk:", error.response.data);
        }
        return res.status(500).send("Server Node.js gặp lỗi: " + error.message);
    }
});

// Chạy server ở cổng mặc định của hệ thống hoặc cổng 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang hoạt động ổn định trên cổng: ${PORT}`);
});
