import os

def create_project_structure():
    # اسم المجلد الرئيسي للمشروع
    project_name = "project_f"
    
    # قائمة المجلدات الفرعية المطلوب إنشاؤها
    folders = [
        project_name,
        f"{project_name}/weights",
        f"{project_name}/templates",
        f"{project_name}/static",
        f"{project_name}/static/css",
        f"{project_name}/static/uploads"
    ]
    
    # قائمة الملفات الأساسية (فارغة مبدئياً)
    files = {
        f"{project_name}/app.py": "# Flask API Main File",
        f"{project_name}/model.py": "# Deep Learning Model Classes",
        f"{project_name}/templates/index.html": "",
        f"{project_name}/static/css/style.css": "/* Custom Styles */"
    }

    print(f"🚀 البدء في إنشاء هيكلية المشروع: {project_name}")

    # إنشاء المجلدات
    for folder in folders:
        if not os.path.exists(folder):
            os.makedirs(folder)
            print(f"✅ تم إنشاء المجلد: {folder}")
        else:
            print(f"🟡 المجلد موجود مسبقاً: {folder}")

    # إنشاء الملفات
    for file_path, initial_content in files.items():
        if not os.path.exists(file_path):
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(initial_content)
            print(f"✅ تم إنشاء الملف: {file_path}")
        else:
            print(f"🟡 الملف موجود مسبقاً: {file_path}")

    print("\n🎉 اكتمل إنشاء الهيكلية! يمكنك الآن البدء في نقل الأكواد إلى ملفاتها.")

if __name__ == "__main__":
    create_project_structure()