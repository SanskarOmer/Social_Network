import "../styles/signup.css";
import { useEffect, useState } from "react";
import api, { formatApiError } from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    dob: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [image, setImage] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const data = new FormData();
    Object.keys(form).forEach((k) => {
      const value = form[k];
      if (value === "" || value === null || value === undefined) return;
      data.append(k, value);
    });
    if (image) data.append("profile_pic", image);

    try {
      await api.post("signup/", data);
      navigate("/");
    } catch (err) {
      setError(formatApiError(err) || "Signup failed");
    }
  };

  return (
    <div className="signup-wrapper">
      <h2>Join Social Network</h2>

      <form className="signup-card" onSubmit={submit}>
        {error && <p className="form-error">{error}</p>}
        <div className="avatar">
          <div className="circle" aria-hidden>
            <img
              className="avatar-preview"
              src={avatarPreviewUrl || "/default-avatar.svg"}
              alt=""
            />
          </div>
          <label className="upload-btn">
            Upload Profile Pic
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setImage(file || null);
                if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
                setAvatarPreviewUrl(file ? URL.createObjectURL(file) : "");
              }}
            />
          </label>
        </div>

        <label>Full Name</label>
        <input name="full_name" placeholder="John Doe" onChange={handleChange} />

        <label>Date of Birth</label>
        <input type="date" name="dob" onChange={handleChange} placeholder="dd/mm/yyyy" />

        <label>Email Address</label>
        <input name="email" onChange={handleChange} />

        <div className="row">
          <div>
            <label>Password</label>
            <input type="password" name="password" onChange={handleChange} />
            <small>Use A-Z, a-z, 0-9, !@#$%^&* in password</small>
          </div>
          <div>
            <label>Re-Password</label>
            <input type="password" name="confirm_password" onChange={handleChange} />
          </div>
        </div>

        <button className="primary-btn">Sign Up</button>
      </form>
    </div>
  );
}
