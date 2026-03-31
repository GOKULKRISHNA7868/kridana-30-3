// Full professional Instagram-style Reel system with swipe, like, save, view count, share, animations, Firebase secure logic
// React + Firebase (Firestore)
// File: src/pages/ReelViewer.jsx

import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { useLocation } from "react-router-dom";
const ReelViewer = () => {
  const { index } = useParams();
  const navigate = useNavigate();

  const location = useLocation();
  const [reels, setReels] = useState(location.state?.reels || []);
  const [activeIndex, setActiveIndex] = useState(Number(index) || 0);
  const [loading, setLoading] = useState(true);

  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [dislikes, setDislikes] = useState(0); // 🔽 DISLIKE
  const [disliked, setDisliked] = useState(false); // 🔽 DISLIKE

  // FOLLOW SYSTEM
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const touchStartY = useRef(null);
  const commentsEndRef = useRef(null);

  const user = auth.currentUser;
  useEffect(() => {
    if (location.state?.reels) {
      setReels(location.state.reels);
      setActiveIndex(Number(index) || 0);
      setLoading(false);
    } else {
      fetchReels();
    }
  }, [location.state, index]);
  /* ================= FETCH REELS ================= */
  useEffect(() => {
    const fetchReels = async () => {
      try {
        const trainerSnap = await getDocs(collection(db, "trainers"));
        const instituteSnap = await getDocs(collection(db, "institutes"));

        let allReels = [];

        trainerSnap.forEach((docu) => {
          const data = docu.data();
          if (Array.isArray(data.reels)) {
            data.reels.forEach((videoUrl, idx) => {
              if (videoUrl) {
                allReels.push({
                  reelId: `trainer_${docu.id}_${idx}`,
                  videoUrl,
                  title: data.trainerName || "Trainer Reel",
                  ownerId: docu.id,
                  type: "trainer",
                });
              }
            });
          }
        });

        instituteSnap.forEach((docu) => {
          const data = docu.data();
          if (Array.isArray(data.reels)) {
            data.reels.forEach((videoUrl, idx) => {
              if (videoUrl) {
                allReels.push({
                  reelId: `institute_${docu.id}_${idx}`,
                  videoUrl,
                  title: data.instituteName || "Institute Reel",
                  ownerId: docu.id,
                  type: "institute",
                });
              }
            });
          }
        });

        setReels(allReels);
        setLoading(false);
      } catch (err) {
        console.error("[Reels] Error:", err);
        setLoading(false);
      }
    };

    fetchReels();
  }, []);
  useEffect(() => {
    if (!location.state?.reels) {
      fetchReels(); // your existing fetch function
    }
  }, []);
  const reel =
    reels.length > 0 && reels[activeIndex] ? reels[activeIndex] : null;

  /* ================= AUTO SCROLL COMMENTS ================= */
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments]);

  /* ================= PROFILE VIEW TRACK ================= */
  useEffect(() => {
    if (!reel || !user || !reel.ownerId) return;

    const registerProfileView = async () => {
      const viewId = `${user.uid}_${reel.ownerId}`;
      const viewRef = doc(db, "profileViews", viewId);
      const analyticsRef = doc(db, "userAnalytics", reel.ownerId);

      const viewSnap = await getDoc(viewRef);

      if (!viewSnap.exists()) {
        await setDoc(viewRef, {
          viewerId: user.uid,
          profileId: reel.ownerId,
          createdAt: serverTimestamp(),
        });

        const analyticsSnap = await getDoc(analyticsRef);

        if (!analyticsSnap.exists()) {
          await setDoc(analyticsRef, {
            profileViews: 1,
            followers: 0,
            connections: 0,
            postEngagement: 0,
            networkGrowth: 0,
            weeklyGrowth: 0,
            engagementRate: 0,
            lastUpdated: serverTimestamp(),
          });
        } else {
          await updateDoc(analyticsRef, {
            profileViews: (analyticsSnap.data().profileViews || 0) + 1,
            lastUpdated: serverTimestamp(),
          });
        }
      }
    };

    registerProfileView();
  }, [reel, user]);

  /* ================= VIEW COUNT ================= */
  useEffect(() => {
    if (!reel || !user || !reel.reelId) return;

    const viewRef = doc(db, "reelViews", reel.reelId + "_" + user.uid);
    if (!reel?.reelId) return;

    const reelRef = doc(db, "reels", reel.reelId);

    const registerView = async () => {
      const viewSnap = await getDoc(viewRef);

      if (!viewSnap.exists()) {
        await setDoc(viewRef, {
          reelId: reel.reelId,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });

        const reelSnap = await getDoc(reelRef);
        if (!reelSnap.exists()) {
          await setDoc(reelRef, { views: 1, likes: 0 });
          setViews(1);
        } else {
          const newViews = (reelSnap.data().views || 0) + 1;
          await updateDoc(reelRef, { views: newViews });
          setViews(newViews);
        }
      } else {
        const reelSnap = await getDoc(reelRef);
        if (reelSnap.exists()) setViews(reelSnap.data().views || 0);
      }
    };

    registerView();
  }, [reel, user]);

  /* ================= LIKE ================= */
  useEffect(() => {
    if (!reel || !user || !reel.reelId) return;

    const likeRef = doc(db, "reelLikes", reel.reelId + "_" + user.uid);
    const reelRef = doc(db, "reels", reel.reelId);

    const checkLike = async () => {
      const likeSnap = await getDoc(likeRef);
      const reelSnap = await getDoc(reelRef);

      if (likeSnap.exists()) setLiked(true);
      if (reelSnap.exists()) setLikes(reelSnap.data().likes || 0);
    };

    checkLike();
  }, [reel, user]);
  /* ================= DISLIKE ================= */ // 🔽 DISLIKE
  useEffect(() => {
    if (!reel || !user || !reel.reelId) return;

    const dislikeRef = doc(db, "reelDislikes", reel.reelId + "_" + user.uid);
    const reelRef = doc(db, "reels", reel.reelId);

    const checkDislike = async () => {
      const dislikeSnap = await getDoc(dislikeRef);
      const reelSnap = await getDoc(reelRef);

      if (dislikeSnap.exists()) setDisliked(true);
      if (reelSnap.exists()) setDislikes(reelSnap.data().dislikes || 0);
    };

    checkDislike();
  }, [reel, user]);

  const toggleLike = async () => {
    if (!user) return alert("Login required");

    const likeRef = doc(db, "reelLikes", reel.reelId + "_" + user.uid);
    const reelRef = doc(db, "reels", reel.reelId);
    const reelSnap = await getDoc(reelRef);

    if (liked) {
      await deleteDoc(likeRef);
      const newLikes = (reelSnap.data().likes || 1) - 1;
      await updateDoc(reelRef, { likes: newLikes });
      setLikes(newLikes);
      setLiked(false);
    } else {
      await setDoc(likeRef, { userId: user.uid, reelId: reel.reelId });
      const newLikes = (reelSnap.data().likes || 0) + 1;
      await updateDoc(reelRef, { likes: newLikes });
      setLikes(newLikes);
      setLiked(true);
    }
  };
  const toggleDislike = async () => {
    // 🔽 DISLIKE
    if (!user) return alert("Login required");

    const dislikeRef = doc(db, "reelDislikes", reel.reelId + "_" + user.uid);
    const reelRef = doc(db, "reels", reel.reelId);
    const reelSnap = await getDoc(reelRef);

    if (disliked) {
      await deleteDoc(dislikeRef);
      const newDislikes = Math.max((reelSnap.data().dislikes || 1) - 1, 0);
      await updateDoc(reelRef, { dislikes: newDislikes });
      setDislikes(newDislikes);
      setDisliked(false);
    } else {
      await setDoc(dislikeRef, { userId: user.uid, reelId: reel.reelId });
      const newDislikes = (reelSnap.data().dislikes || 0) + 1;
      await updateDoc(reelRef, { dislikes: newDislikes });
      setDislikes(newDislikes);
      setDisliked(true);
    }
  };
  /* ================= REALTIME DISLIKE COUNT ================= */ // 🔽 DISLIKE REALTIME
  useEffect(() => {
    if (!reel?.reelId) return;

    const reelRef = doc(db, "reels", reel.reelId);

    const unsub = onSnapshot(reelRef, (snap) => {
      if (snap.exists()) {
        setDislikes(snap.data().dislikes || 0);
      }
    });

    return () => unsub();
  }, [reel?.reelId]);

  /* ================= FOLLOW SYSTEM ================= */
  useEffect(() => {
    if (!user || !reel) return;

    if (!user || !reel?.ownerId) return;

    const followRef = doc(db, "followers", `${user.uid}_${reel.ownerId}`);

    const unsub = onSnapshot(followRef, (snap) => {
      setIsFollowing(snap.exists());
    });

    return () => unsub();
  }, [user, reel]);
  useEffect(() => {
    if (reels.length > 0) {
      if (activeIndex >= reels.length) {
        setActiveIndex(0); // reset safely
      }
    }
  }, [reels]);
  const followProfile = async () => {
    if (!user || !reel) return;
    if (followLoading) return;

    setFollowLoading(true);

    const followRef = doc(db, "followers", `${user.uid}_${reel.ownerId}`);
    const analyticsRef = doc(db, "userAnalytics", reel.ownerId);

    const snap = await getDoc(followRef);

    if (!snap.exists()) {
      await setDoc(followRef, {
        followerId: user.uid,
        profileId: reel.ownerId,
        createdAt: serverTimestamp(),
      });

      const analyticsSnap = await getDoc(analyticsRef);
      if (analyticsSnap.exists()) {
        await updateDoc(analyticsRef, {
          followers: (analyticsSnap.data().followers || 0) + 1,
          connections: (analyticsSnap.data().connections || 0) + 1,
          networkGrowth: (analyticsSnap.data().networkGrowth || 0) + 1,
          lastUpdated: serverTimestamp(),
        });
      }
    }

    setFollowLoading(false);
  };

  const unfollowProfile = async () => {
    if (!user || !reel) return;
    if (followLoading) return;

    setFollowLoading(true);

    const followRef = doc(db, "followers", `${user.uid}_${reel.ownerId}`);
    const analyticsRef = doc(db, "userAnalytics", reel.ownerId);

    const snap = await getDoc(followRef);

    if (snap.exists()) {
      await deleteDoc(followRef);

      const analyticsSnap = await getDoc(analyticsRef);
      if (analyticsSnap.exists()) {
        await updateDoc(analyticsRef, {
          followers: Math.max((analyticsSnap.data().followers || 1) - 1, 0),
          connections: Math.max((analyticsSnap.data().connections || 1) - 1, 0),
          lastUpdated: serverTimestamp(),
        });
      }
    }

    setFollowLoading(false);
  };

  /* ================= COMMENTS ================= */
  useEffect(() => {
    if (!reel) return;

    const q = query(
      collection(db, "reelComments", reel.reelId, "comments"),
      orderBy("createdAt", "asc"),
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setComments(list);
    });

    return () => unsub();
  }, [reel]);

  const sendComment = async () => {
    if (!user || !commentText.trim()) return;

    await addDoc(collection(db, "reelComments", reel.reelId, "comments"), {
      userId: user.uid,
      userName: user.displayName || user.email || "User",
      text: commentText,
      createdAt: serverTimestamp(),
    });

    setCommentText("");
  };
  /* ================= PROFILE VIEW TRACK (ON CLICK) ================= */

  const trackProfileView = async (ownerId, ownerType) => {
    try {
      const viewer = auth.currentUser;
      if (!viewer) return;

      // ❌ prevent self-view count
      if (viewer.uid === ownerId) return;

      await addDoc(collection(db, "profileViews"), {
        ownerId: ownerId, // profile owner (institute/trainer)
        ownerType: ownerType, // "institute" | "trainer"
        viewerId: viewer.uid, // who viewed
        timestamp: serverTimestamp(),
      });

      console.log("✅ Profile view tracked");
    } catch (err) {
      console.error("❌ Profile view track failed:", err);
    }
  };
  /* ================= SWIPE ================= */
  const onTouchStart = (e) => (touchStartY.current = e.touches[0].clientY);
  const onTouchEnd = (e) => {
    if (!touchStartY.current) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;

    if (diff > 80) setActiveIndex((p) => (p + 1 >= reels.length ? 0 : p + 1));
    if (diff < -80)
      setActiveIndex((p) => (p - 1 < 0 ? reels.length - 1 : p - 1));
  };

  if (loading || !reel) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse text-lg font-semibold">
          Loading reel...
        </div>
      </div>
    );
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: "fixed",
        inset: 0,
        background: "black",
        zIndex: 999999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* SIDE NAVIGATION OUTSIDE VIDEO */}
      <div
        style={{
          position: "absolute",
          right: "400px",
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          zIndex: 20,
        }}
      >
        {/* UP */}
        <button
          onClick={() =>
            setActiveIndex((p) => (p - 1 < 0 ? reels.length - 1 : p - 1))
          }
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            background: "#ff7a00",
            color: "white",
            fontSize: "22px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          ↑
        </button>

        {/* DOWN */}
        <button
          onClick={() =>
            setActiveIndex((p) => (p + 1 >= reels.length ? 0 : p + 1))
          }
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            background: "#ff7a00",
            color: "white",
            fontSize: "22px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          ↓
        </button>
      </div>

      {/* MAIN PHONE FRAME */}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          height: "100vh",
          position: "relative",
          overflow: "hidden",
          borderRadius: "12px",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.video
            key={reel.reelId}
            src={reel.videoUrl}
            autoPlay
            loop
            playsInline
            controls={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </AnimatePresence>

        {/* VIEWS BADGE */}
        <div className="absolute top-3 right-3 bg-white/90 text-black text-xs font-semibold px-3 py-1 rounded-full">
          {views} Views
        </div>

        {/* PROFILE + FOLLOW BAR */}
        <div className="absolute bottom-16 left-4 text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>

          <span className="text-sm font-semibold">{reel.title}</span>

          {!isFollowing ? (
            <button
              onClick={followProfile}
              disabled={followLoading}
              className="bg-orange-500 text-white text-xs px-3 py-1 rounded font-bold"
            >
              Follow
            </button>
          ) : (
            <button
              onClick={unfollowProfile}
              disabled={followLoading}
              className="bg-white text-black text-xs px-3 py-1 rounded font-bold"
            >
              Following
            </button>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 text-white">
          {/* LIKE */}
          <button onClick={toggleLike} className="text-xl">
            {liked ? "❤️" : "🤍"}
            <div className="text-xs">{likes}</div>
          </button>

          {/* DISLIKE */}
          <button onClick={toggleDislike} className="text-xl">
            {disliked ? "👎" : "👍"}
            <div className="text-xs">{dislikes}</div>
          </button>

          {/* COMMENTS */}
          <button onClick={() => setShowComments(true)} className="text-xl">
            💬
            <div className="text-xs">{comments.length}</div>
          </button>

          {/* SHARE */}
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="text-xl"
          >
            📤
          </button>
        </div>

        {/* SIDE NAVIGATION (PC) */}
        {/* SIDE NAVIGATION (PC / LAPTOP) */}
        {/* SIDE NAVIGATION (PC / LAPTOP) */}

        {/* PROFILE BUTTON */}
        <button
          onClick={async () => {
            await trackProfileView(reel.ownerId, reel.type);
            navigate(
              reel.type === "trainer"
                ? `/trainers/${reel.ownerId}`
                : `/institutes/${reel.ownerId}`,
            );
          }}
          className="absolute bottom-4 left-4 bg-white text-black px-4 py-2 rounded-full text-xs font-bold shadow-lg"
        >
          View Profile
        </button>
      </div>
    </div>
  );
};

export default ReelViewer;
