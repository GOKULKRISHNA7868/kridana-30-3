// src/pages/TrainerDetailsPage.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Star,
  Award,
  Calendar,
  Building2,
  Globe,
  Users,
  BadgeCheck,
  GraduationCap,
  ShieldCheck,
  CreditCard,
  Landmark,
  Briefcase,
  Image,
  Video,
} from "lucide-react";
import { motion } from "framer-motion";
import { setDoc, serverTimestamp } from "firebase/firestore";
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

export default function TrainerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState(null);

  useEffect(() => {
    const loadTrainer = async () => {
      const snap = await getDoc(doc(db, "trainers", id));
      if (snap.exists()) setTrainer({ id: snap.id, ...snap.data() });
    };
    loadTrainer();
  }, [id]);

  const handleRating = async (star) => {
    const user = auth.currentUser;
    if (!user || !trainer) return;

    const ratings = trainer.ratingsByUser || {};
    if (ratings[user.uid] !== undefined) return alert("Already rated");

    const count = trainer.ratingCount || 0;
    const avg = trainer.rating || 0;
    const newAvg = (avg * count + star) / (count + 1);

    await updateDoc(doc(db, "trainers", id), {
      rating: newAvg,
      ratingCount: count + 1,
      [`ratingsByUser.${user.uid}`]: star,
    });

    setTrainer((prev) => ({
      ...prev,
      rating: newAvg,
      ratingCount: count + 1,
      ratingsByUser: { ...ratings, [user.uid]: star },
    }));
  };
  const startTrainerChat = async () => {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login to chat with trainer");
      navigate("/login");
      return;
    }

    const chatId = [user.uid, trainer.id].sort().join("_");

    const chatRef = doc(db, "chats", chatId);

    await setDoc(
      chatRef,
      {
        type: "individual",
        members: [user.uid, trainer.id],
        trainerId: trainer.id,
        createdAt: serverTimestamp(),
        lastAt: serverTimestamp(),
        lastMessage: "",
      },
      { merge: true },
    );

    navigate(`/chat/${chatId}`, {
      state: {
        chatName:
          trainer.trainerName ||
          `${trainer.firstName} ${trainer.lastName}` ||
          "Trainer",
        chatType: "trainer",
      },
    });
  };
  if (!trainer) {
    return (
      <div className="min-h-screen flex justify-center items-center text-xl font-semibold">
        Loading Trainer Profile...
      </div>
    );
  }

  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    trainer.fullAddress || `${trainer.latitude},${trainer.longitude}`,
  )}&output=embed`;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* ================= HEADER ================= */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.6 }}
        className="bg-white px-5 md:px-24 py-10 shadow-sm"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#ff7a00] font-semibold mb-6 hover:gap-3 transition-all"
        >
          <ArrowLeft size={20} /> Back
        </button>

        <div className="flex flex-col md:flex-row gap-10 items-center">
          <div className="w-52 h-52 rounded-full overflow-hidden border-4 border-orange-400 shadow-lg">
            <img
              src={trainer.profileImageUrl}
              className="w-full h-full object-cover object-center scale-105"
            />
          </div>

          <div className="flex-1">
            <h1 className="text-4xl font-bold text-[#ff7a00]">
              {trainer.trainerName ||
                `${trainer.firstName} ${trainer.lastName}`}
            </h1>

            <p className="text-gray-500 mt-1">
              {trainer.designation || "Trainer"} • {trainer.organization || "—"}
            </p>

            <p className="flex items-center gap-2 text-gray-600 mt-3">
              <MapPin size={18} />
              {trainer.fullAddress || trainer.locationName}
            </p>

            {/* ⭐ Rating */}
            <div className="flex gap-2 my-4 items-center">
              {[1, 2, 3, 4, 5].map((s) => {
                const alreadyRated =
                  trainer.ratingsByUser?.[auth.currentUser?.uid] !== undefined;
                return (
                  <span
                    key={s}
                    onClick={() => !alreadyRated && handleRating(s)}
                    className={`text-3xl ${
                      trainer.ratingsByUser?.[auth.currentUser?.uid] >= s
                        ? "text-yellow-400"
                        : "text-gray-300"
                    } ${alreadyRated ? "opacity-60" : "cursor-pointer"}`}
                  >
                    <Star />
                  </span>
                );
              })}
              <span className="ml-2 font-semibold">
                {trainer.rating?.toFixed(1) || "No ratings"} (
                {trainer.ratingCount || 0})
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <Stat
                icon={Users}
                label="Students"
                value={trainer.students?.length || 0}
              />
              <Stat
                icon={Calendar}
                label="Experience"
                value={trainer.experience || "—"}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 mt-6">
              {trainer.phoneNumber && (
                <a href={`tel:${trainer.phoneNumber}`} className="btn-primary">
                  <img src="/call-icon.png" className="w-4 h-4" alt="call" />
                  Call
                </a>
              )}

              {trainer.email && trainer.email.includes("@") && (
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${trainer.email.trim()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline flex items-center gap-2"
                >
                  <img src="/email-icon.png" className="w-4 h-4" alt="email" />
                  Email
                </a>
              )}

              <button
                onClick={startTrainerChat}
                className="btn-outline flex items-center gap-2"
              >
                <img src="/chat-icon.png" className="w-5 h-5" alt="chat" />
                Chat
              </button>

              <button
                onClick={() => navigate(`/book-demo/${trainer.id}`)}
                className="btn-outline flex items-center gap-2"
              >
                <Calendar size={16} className="text-[#ff7a00]" />
                Book Demo
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ================= MAP ================= */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="px-5 md:px-24 py-10"
      >
        <div className="bg-white rounded-2xl overflow-hidden shadow-md">
          <iframe title="Location" src={mapSrc} className="w-full h-[350px]" />
        </div>
      </motion.section>

      {/* ================= INFORMATION GRID ================= */}
      <SectionBlock title="Trainer Information">
        <Info
          icon={Building2}
          label="Organization"
          value={trainer.organization}
        />
        <Info icon={Briefcase} label="Founder" value={trainer.founderName} />
        <Info
          icon={ShieldCheck}
          label="Facilities"
          value={trainer.facilitiesInfrastructure}
        />
        <Info
          icon={Calendar}
          label="Year Founded"
          value={trainer.yearFounded}
        />
        <Info
          icon={BadgeCheck}
          label="Trainer Type"
          value={trainer.trainerType}
        />
        <Info
          icon={GraduationCap}
          label="Institute"
          value={trainer.instituteName}
        />
      </SectionBlock>

      {/* ================= PRICING ================= */}
      <SectionBlock title="Pricing & Payments">
        <Info
          icon={CreditCard}
          label="Monthly Fees"
          value={trainer.pricing?.monthlyFees}
        />
        <Info
          icon={CreditCard}
          label="Registration Fees"
          value={trainer.pricing?.registrationFees}
        />
        <Info
          icon={CreditCard}
          label="Uniform Cost"
          value={trainer.pricing?.uniformCost}
        />
        <Info
          icon={Landmark}
          label="Payment Methods"
          value={trainer.pricing?.paymentMethods}
        />
      </SectionBlock>

      {/* ================= CATEGORIES ================= */}
      <motion.section className="px-5 md:px-24 py-14">
        <h2 className="section-title">Categories & Subcategories</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainer.categories &&
            Object.entries(trainer.categories).map(([cat, subs]) => (
              <motion.div
                whileHover={{ scale: 1.03 }}
                key={cat}
                className="bg-white rounded-2xl p-6 shadow-sm border"
              >
                <h3 className="font-bold text-lg mb-2">{cat}</h3>
                <ul className="list-disc ml-5 text-gray-700">
                  {subs.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
        </div>
      </motion.section>

      {/* ================= MEDIA ================= */}
      <MediaBlock title="Photos" items={trainer.images} type="image" />
      <MediaBlock title="Awards" items={trainer.awardsImages} type="image" />
      <MediaBlock
        title="Media Mentions"
        items={trainer.mediaMentions}
        type="image"
      />
      <MediaBlock title="Videos" items={trainer.videos} type="video" />
      <MediaBlock title="Reels" items={trainer.reels} type="reel" />
    </div>
  );
}

/* ================= COMPONENTS ================= */

const SectionBlock = ({ title, children }) => (
  <motion.section
    variants={fadeUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className="px-5 md:px-24 py-14"
  >
    <h2 className="section-title">{title}</h2>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>
  </motion.section>
);

const Info = ({ icon: Icon, label, value }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-white p-5 rounded-2xl shadow-sm border"
  >
    <div className="flex items-center gap-2 mb-1">
      <Icon size={18} className="text-[#ff7a00]" />
      <p className="text-sm text-gray-500">{label}</p>
    </div>
    <p className="font-semibold text-gray-800">{value || "—"}</p>
  </motion.div>
);

const Stat = ({ icon: Icon, label, value }) => (
  <div className="bg-gray-50 p-3 rounded-xl flex gap-3 items-center shadow-sm">
    <Icon size={18} className="text-[#ff7a00]" />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  </div>
);

const MediaBlock = ({ title, items, type }) => {
  if (!items || items.length === 0) return null;

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="px-5 md:px-24 py-14"
    >
      <h2 className="section-title">{title}</h2>

      {type === "image" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((img, i) => (
            <motion.img
              whileHover={{ scale: 1.05 }}
              key={i}
              src={img}
              className="w-full h-44 object-cover rounded-2xl shadow-md border"
            />
          ))}
        </div>
      )}

      {type === "video" && (
        <div className="grid md:grid-cols-2 gap-6">
          {items.map((vid, i) => (
            <video
              key={i}
              controls
              className="w-full rounded-2xl shadow-md border"
            >
              <source src={vid} type="video/mp4" />
            </video>
          ))}
        </div>
      )}

      {type === "reel" && (
        <div className="flex gap-6 overflow-x-auto">
          {items.map((vid, i) => (
            <video
              key={i}
              controls
              className="min-w-[260px] h-[420px] rounded-2xl shadow-md border"
            >
              <source src={vid} type="video/mp4" />
            </video>
          ))}
        </div>
      )}
    </motion.section>
  );
};

/* ================= UI CLASSES ================= */
/*
btn-primary = "flex items-center gap-2 px-5 py-3 rounded-xl bg-[#ff7a00] text-white hover:scale-105 transition font-semibold"
btn-outline = "flex items-center gap-2 px-5 py-3 rounded-xl border border-[#ff7a00] text-[#ff7a00] hover:bg-[#ff7a00] hover:text-white transition font-semibold"
btn-outline-dark = "flex items-center gap-2 px-5 py-3 rounded-xl border text-gray-800 bg-white hover:shadow-md transition font-semibold"
btn-dark = "flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-900 text-white hover:bg-black hover:scale-105 transition font-semibold shadow-md"
section-title = "text-3xl font-bold text-[#ff7a00] mb-8"
*/
