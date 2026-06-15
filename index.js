const express = require('express');
const axios = require('axios');
const app = express();

// Nhận dữ liệu ảnh dung lượng lớn từ Google Sheets
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
    res.send("Server chuyển tiếp ảnh đang chạy tốt!");
});

app.post('/', async (req, res) => {
    try {
        const payload = req.body;
        
        // Phản hồi ngay cho Google Sheets để không lo timeout
        res.status(200).send("Đã nhận ảnh. Đang đẩy sang SeaTalk...");

        // Xử lý gửi tin nhắn ngầm
        setImmediate(async () => {
            try {
                const { webhook_url, image_base64, filename } = payload;
                
                if (!webhook_url || !image_base64) {
                    return console.error("[Lỗi]: Thiếu webhook_url hoặc dữ liệu ảnh.");
                }

                // CHUẨN HÓA CHUỖI BASE64: Loại bỏ phần định dạng header nếu có
                const cleanBase64 = image_base64.replace(/^data:image\/\w+;base64,/, "");

                // CẤU TRÚC PAYLOAD CHUẨN ĐỔI THEO ĐÚNG API SEATALK WEBHOOK V2
                const seatalkPayload = {
                    "message_type": "image",
                    "image": {
                        "base64_image": cleanBase64
                    }
                };

                console.log(`[Đang gửi]: Đang tiến hành đẩy ảnh file ${filename} sang SeaTalk...`);

                // Gọi API sang SeaTalk
                const response = await axios.post(webhook_url, seatalkPayload, {
                    headers: { 'Content-Type': 'application/json' }
                });
                
                console.log(`[Kết quả] Phản hồi từ SeaTalk cho file ${filename}:`, response.data);

            } catch (bgError) {
                console.error("[Lỗi từ phía hệ thống SeaTalk]:", bgError.message);
                if (bgError.response) {
                    console.error("[Chi tiết lỗi SeaTalk trả về]:", JSON.stringify(bgError.response.data));
                }
            }
        });

    } catch (error) {
        console.error("Lỗi hệ thống tại đầu nhận dữ liệu:", error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy tại port: ${PORT}`));
