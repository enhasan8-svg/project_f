# استخدام نسخة بايثون رسمية
FROM python:3.9

# تحديد مكان العمل داخل السيرفر
WORKDIR /code

# نسخ ملف المكتبات وتثبيتها
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# نسخ بقية ملفات المشروع (app.py, model.py, templates, static, etc.)
COPY . .

# تشغيل التطبيق
CMD ["python", "app.py"]