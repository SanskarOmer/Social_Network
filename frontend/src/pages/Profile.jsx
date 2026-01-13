import "../styles/profile.css";
import { useEffect, useState } from "react";
import api, { BASE_URL } from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [formError, setFormError] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    full_name: "",
    dob: "",
  });
  const [newPic, setNewPic] = useState(null);

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);

  const resolveMediaUrl = (value) => {
    if (!value) return "";
    if (typeof value !== "string") return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return `${BASE_URL}${value}`;
  };

  const resolveAvatarUrl = (value) => {
    const url = resolveMediaUrl(value);
    return url || "/default-avatar.svg";
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common.Authorization;
    navigate("/", { replace: true });
  };

  const validateImageFile = (file, { maxBytes }) => {
    if (!file) return null;
    if (file.size > maxBytes) {
      return `Image must be <= ${Math.round(maxBytes / (1024 * 1024))}MB`;
    }
    if (file.type && !file.type.startsWith("image/")) {
      return "File must be an image";
    }
    return null;
  };

  const isOwnPost = (post) => {
    if (!profile?.id) return false;
    return String(post?.user) === String(profile.id);
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get("profile/");
      setProfile(res.data);
      setEditData({
        full_name: res.data.full_name || "",
        dob: res.data.dob || "",
      });
    } catch (err) {
      console.error("Profile fetch error:", err.response?.data || err.message);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await api.get("posts/");
      setPosts(res.data);
    } catch (err) {
      console.error("Posts fetch error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, []);

  const applyReactionUpdate = (postId, updater) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? updater(p) : p))
    );
  };

  const toggleLike = async (postId) => {
    applyReactionUpdate(postId, (p) => {
      const next = { ...p };
      const willLike = !next.user_liked;

      if (willLike) {
        next.likes = (next.likes || 0) + 1;
        if (next.user_disliked) {
          next.dislikes = Math.max(0, (next.dislikes || 0) - 1);
        }
        next.user_liked = true;
        next.user_disliked = false;
      } else {
        next.likes = Math.max(0, (next.likes || 0) - 1);
        next.user_liked = false;
      }
      return next;
    });

    try {
      const res = await api.post(`posts/${postId}/like/`);
      applyReactionUpdate(postId, (p) => ({
        ...p,
        likes: res.data.likes,
        dislikes: res.data.dislikes,
        user_liked: res.data.user_liked,
        user_disliked: res.data.user_disliked,
      }));
    } catch (err) {
      console.error("Like toggle error:", err.response?.data || err.message);
      fetchPosts();
    }
  };

  const toggleDislike = async (postId) => {
    applyReactionUpdate(postId, (p) => {
      const next = { ...p };
      const willDislike = !next.user_disliked;

      if (willDislike) {
        next.dislikes = (next.dislikes || 0) + 1;
        if (next.user_liked) {
          next.likes = Math.max(0, (next.likes || 0) - 1);
        }
        next.user_disliked = true;
        next.user_liked = false;
      } else {
        next.dislikes = Math.max(0, (next.dislikes || 0) - 1);
        next.user_disliked = false;
      }
      return next;
    });

    try {
      const res = await api.post(`posts/${postId}/dislike/`);
      applyReactionUpdate(postId, (p) => ({
        ...p,
        likes: res.data.likes,
        dislikes: res.data.dislikes,
        user_liked: res.data.user_liked,
        user_disliked: res.data.user_disliked,
      }));
    } catch (err) {
      console.error("Dislike toggle error:", err.response?.data || err.message);
      fetchPosts();
    }
  };

  const deletePost = async (postId) => {
    const ok = window.confirm("Delete this post?");
    if (!ok) return;

    const prev = posts;
    setPosts((p) => p.filter((x) => x.id !== postId));

    try {
      await api.delete(`posts/${postId}/`);
    } catch (err) {
      console.error("Delete post error:", err.response?.data || err.message);
      setPosts(prev);
    }
  };

  const saveProfile = async () => {
    setFormError("");
    if (!editData.full_name?.trim()) {
      setFormError("Full name is required");
      return;
    }
    if (editData.dob) {
      const dob = new Date(editData.dob);
      const now = new Date();
      if (dob > now) {
        setFormError("Date of birth cannot be in the future");
        return;
      }
    }
    const picErr = validateImageFile(newPic, { maxBytes: 5 * 1024 * 1024 });
    if (picErr) {
      setFormError(picErr);
      return;
    }

    try {
      const data = new FormData();
      data.append("full_name", editData.full_name);
      if (editData.dob) data.append("dob", editData.dob);
      if (newPic) data.append("profile_pic", newPic);

      await api.patch("profile/", data);
      setEditMode(false);
      fetchProfile();
    } catch (err) {
      console.error("Profile update error:", err.response?.data || err.message);
      setFormError("Profile update failed");
    }
  };

  const addPost = async () => {
    setFormError("");
    const trimmed = (text || "").trim();
    if (!trimmed && !image) {
      setFormError("Write something or add an image");
      return;
    }
    const imgErr = validateImageFile(image, { maxBytes: 8 * 1024 * 1024 });
    if (imgErr) {
      setFormError(imgErr);
      return;
    }

    try {
      const data = new FormData();
      if (trimmed) data.append("description", trimmed);
      if (image) data.append("image", image);

      await api.post("posts/", data);
      setText("");
      setImage(null);
      fetchPosts();
    } catch (err) {
      console.error("Add post error:", err.response?.data || err.message);
      setFormError("Posting failed");
    }
  };

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="top-bar">
          <div className="top-title">Social Network</div>
          <button className="logout-btn" type="button" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="profile-layout">
          {/* PROFILE CARD */}
          <div className="profile-card">
          <div className="profile-header">
            <img
              src={resolveAvatarUrl(profile.profile_pic)}
              alt=""
            />
            <span className="edit-icon" onClick={() => setEditMode(!editMode)}>
              ✏️
            </span>
          </div>

          {!editMode ? (
            <>
              <h3>{profile.full_name}</h3>
              <p className="muted">{profile.email}</p>

              <div className="dob-row">
                <span>DOB - {profile.dob}</span>
                <button
                  className="icon-btn"
                  type="button"
                  onClick={() => setEditMode(true)}
                  aria-label="Edit date of birth"
                  title="Edit"
                >
                  ✏️
                </button>
              </div>

              <button className="share-btn" type="button">
                Share Profile
              </button>
            </>
          ) : (
            <>
              <input
                value={editData.full_name}
                onChange={(e) =>
                  setEditData({ ...editData, full_name: e.target.value })
                }
                placeholder="Full Name"
              />
              <input
                type="date"
                value={editData.dob}
                onChange={(e) =>
                  setEditData({ ...editData, dob: e.target.value })
                }
              />

              <label className="file-btn">
                Change photo
                <input
                  type="file"
                  hidden
                  onChange={(e) => setNewPic(e.target.files[0])}
                />
              </label>

              <button onClick={saveProfile}>Save</button>
            </>
          )}
          </div>

          {/* POSTS FEED */}
          <div className="feed">
          <div className="add-post">
            <div className="card-title">Add Post</div>

            {formError && <div className="inline-error">{formError}</div>}

            <textarea
              placeholder="What's on your mind?"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            {image && (
              <div className="image-preview">
                <img src={URL.createObjectURL(image)} alt="" />
                <button
                  type="button"
                  className="remove-image"
                  onClick={() => setImage(null)}
                  aria-label="Remove image"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            )}

            <div className="add-post-actions">
              <button className="post-btn" onClick={addPost}>
                Post
              </button>

              <label className="add-image-btn">
                <span aria-hidden>🖼️</span> Add Image
                <input
                  type="file"
                  hidden
                  onChange={(e) => setImage(e.target.files[0])}
                />
              </label>
            </div>
          </div>

          <div className="post-list">
            {posts.map((p) => (
              <div className="post-card" key={p.id}>
                <div className="post-head">
                  <div className="post-user">
                    <img
                      className="post-avatar"
                      src={resolveAvatarUrl(p.user_pic)}
                      alt=""
                    />
                    <div className="post-user-meta">
                      <div className="post-user-name">{p.user_name}</div>
                      <div className="post-date">Posted on - {p.created_at?.slice(0, 10)}</div>
                    </div>
                  </div>

                  {isOwnPost(p) && (
                    <button
                      className="post-close"
                      onClick={() => deletePost(p.id)}
                      title="Delete post"
                      aria-label="Delete post"
                    >
                      ×
                    </button>
                  )}
                </div>

                <p className="post-text">{p.description}</p>

                {p.image && (
                  <img className="post-image" src={resolveMediaUrl(p.image)} alt="" />
                )}

                <div className="actions">
                  <button
                    className={p.user_liked ? "reaction active" : "reaction"}
                    onClick={() => toggleLike(p.id)}
                    type="button"
                  >
                    👍 Like {p.likes}
                  </button>
                  <button
                    className={p.user_disliked ? "reaction active" : "reaction"}
                    onClick={() => toggleDislike(p.id)}
                    type="button"
                  >
                    👎 Dislike {p.dislikes}
                  </button>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
