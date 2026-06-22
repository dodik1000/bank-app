import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import PersonalInfoSection from "../PersonalInfoSection/PersonalInfoSection";
import PassportInfoSection from "../PassportInfoSection/PassportInfoSection";
import FileUploader from "../FileUploader/FileUploader";
import arrowLeftIcon from "../../assets/imgs/icon-arrow-left.png";
import "./index.scss";

export default function EnterpriseForm({
  userId,
  userEmail,
  onProfileCreated,
}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
    phone: "",
    passportSeries: "",
    passportNumber: "",
    passportIssuedBy: "",
    passportIssueDate: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // form database submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      alert("Пожалуйста, загрузите хотя бы один подтверждающий документ.");
      return;
    }

    const hasErrors = files.some((f) =>
      ["error_quota", "error_upload", "error_format"].includes(f.status),
    );
    if (hasErrors) {
      alert("Исправьте ошибки в загруженных документах.");
      return;
    }

    setLoading(true);

    // database insert operation storing linkable unique user registration email
    const { error } = await supabase.from("profiles").insert([
      {
        id: userId,
        email: userEmail?.toLowerCase() || null,
        full_name: formData.fullName,
        address: formData.address,
        phone: formData.phone,
        passport_series: formData.passportSeries,
        passport_number: formData.passportNumber,
        passport_issued_by: formData.passportIssuedBy,
        passport_issue_date: formData.passportIssueDate,
      },
    ]);

    setLoading(false);

    if (error) {
      alert(`Ошибка регистрации профиля: ${error.message}`);
    } else {
      onProfileCreated();
    }
  };

  return (
    <main className="form-container">
      <form className="wizard-form" onSubmit={handleFormSubmit}>
        <PersonalInfoSection formData={formData} onChange={handleInputChange} />
        <PassportInfoSection formData={formData} onChange={handleInputChange} />
        <FileUploader files={files} setFiles={setFiles} />

        <div className="form-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => supabase.auth.signOut()}
          >
            <img src={arrowLeftIcon} alt="" className="btn-back-icon" /> Выйти
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Сохранение..." : "Создать документ"}
          </button>
        </div>
      </form>
    </main>
  );
}
