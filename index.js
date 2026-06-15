const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
    res.send("Server chuyển tiếp ảnh đang chạy tốt!");
});

app.post('/', async (req, res) => {
    try {
        const payload = req.body;
        
        // Phản hồi ngay cho Google Sheets không lo timeout
        res.status(200).send("Đã nhận ảnh. Đang đẩy sang SeaTalk...");

        setImmediate(async () => {
            try {
                const { webhook_url, image_base64, filename } = payload;
                if (!webhook_url || !image_base64) return console.error("Thiếu dữ liệu gửi tin.");

                // Cấu hình payload hình ảnh chuẩn đét của SeaTalk Webhook
                const seatalkPayload = {
                    "tag": "image",
                    "image": {
                        "base64_image": image_base64
                    }
                };

                await axios.post(webhook_url, seatalkPayload, {
                    headers: { 'Content-Type': 'application/json' }
                });
                
                console.log(`[Thành công] Đã đẩy ảnh sheet: ${filename}`);

            } catch (bgError) {
                console.error("[Lỗi SeaTalk]:", bgError.message);
            }
        });

    } catch (error) {
        console.error("Lỗi nhận dữ liệu:", error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy tại port: ${PORT}`));
