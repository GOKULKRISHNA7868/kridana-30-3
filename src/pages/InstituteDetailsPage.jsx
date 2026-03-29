import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Users,
  UserCheck,
  Calendar,
  Award,
  Building2,
  ShieldCheck,
  Wallet,
  BookOpen,
  Star,
  BadgeCheck,
  Landmark,
  CreditCard,
} from "lucide-react";
import { motion } from "framer-motion";

export default function InstituteDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inst, setInst] = useState(null);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "institutes", id));
      if (snap.exists()) {
        setInst({
          id: snap.id,
          ...snap.data(),
        });
      }
    };
    load();
  }, [id]);
  const startInstituteChat = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please login to chat with the institute.");
      return;
    }

    const chatId = [user.uid, inst.id].sort().join("_"); // unique chat id
    const chatRef = doc(db, "chats", chatId);
    const snap = await getDoc(chatRef);

    if (!snap.exists()) {
      // Create new chat if not exists
      await setDoc(chatRef, {
        type: "individual",
        instituteId: inst.id,
        members: [user.uid, inst.id],
        createdAt: serverTimestamp(),
        lastMessage: "",
      });
    }

    // Navigate to ChatBox page or open modal
    navigate(`/chat/${chatId}`, { state: { chatName: inst.instituteName } });
  };
  const handleRating = async (star) => {
    const user = auth.currentUser;
    if (!user || !inst) return;

    const ratings = inst.ratingsByUser || {};

    if (ratings[user.uid] !== undefined) {
      alert("You have already submitted your review.");
      return;
    }

    const count = inst.ratingCount || 0;
    const avg = inst.rating || 0;
    const newAvg = (avg * count + star) / (count + 1);

    await updateDoc(doc(db, "institutes", id), {
      rating: newAvg,
      ratingCount: count + 1,
      [`ratingsByUser.${user.uid}`]: star,
    });

    setInst((prev) => ({
      ...prev,
      rating: newAvg,
      ratingCount: count + 1,
      ratingsByUser: {
        ...ratings,
        [user.uid]: star,
      },
    }));
  };

  if (!inst) return null;

  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    `${inst.landmark}, ${inst.city}, ${inst.state}, ${inst.country}`,
  )}&output=embed`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-50 px-5 md:px-24 py-10"
    >
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-orange-600 font-semibold mb-6 hover:gap-3 transition-all"
      >
        <ArrowLeft size={20} /> Back
      </button>

      {/* HEADER */}
      <div className="bg-white rounded-3xl shadow-xl p-8 grid lg:grid-cols-[350px_1fr] gap-10">
        {/* LEFT */}
        <div className="flex flex-col items-center text-center">
          <img
            src={inst.profileImageUrl}
            className="w-44 h-44 rounded-full object-cover border-4 border-orange-400 shadow-lg"
          />

          <h1 className="text-3xl font-extrabold text-orange-600 mt-4">
            {inst.instituteName}
          </h1>

          <p className="text-gray-500 mt-2">{inst.organizationType}</p>

          {/* Rating */}
          <div className="flex gap-1 mt-3">
{[1, 2, 3, 4, 5].map((s) => {
  const isActive =
    inst.ratingsByUser?.[auth.currentUser?.uid] >= s;

  return (
    <Star
      key={s}
      onClick={() => handleRating(s)}
      className={`w-6 h-6 cursor-pointer ${
        isActive
          ? "text-yellow-400 fill-yellow-400"
          : "text-gray-300"
      }`}
    />
  );
})}
          </div>

          <p className="text-sm font-semibold mt-1">
            {inst.rating?.toFixed(1) || "0.0"} ⭐ ({inst.ratingCount || 0}{" "}
            reviews)
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3 w-full mt-6">
<a href={`tel:${inst.phoneNumber}`} className="btn-primary">
  <img src="/call-icon.png" className="w-4 h-4" alt="call" />
  Call
</a>

<button
  onClick={() => navigate(`/book-demo/${inst.id}`)}
  className="btn-success"
>
  <Calendar size={16} className="text-[#000000]" />
  Book Demo Class
</button>

{auth.currentUser && (
  <button onClick={() => startInstituteChat()} className="btn-primary">
    <img src="/chat-icon.png" className="w-5 h-5" alt="chat" />
    Chat with Institute
  </button>
)}

{inst.email && inst.email.includes("@") && (
  <a
    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${inst.email.trim()}`}
    target="_blank"
    rel="noopener noreferrer"
    className="btn-outline"
  >
    <img src="/email-icon.png" className="w-4 h-4" alt="email" />
    Email
  </a>
)}
          </div>
        </div>

        {/* RIGHT */}
        <div className="grid gap-6">
          <InfoGrid inst={inst} />

          {/* MAP */}
          <div className="w-full h-[300px] rounded-2xl overflow-hidden border">
            <iframe src={mapSrc} className="w-full h-full" loading="lazy" />
          </div>
        </div>
      </div>

      {/* SECTIONS */}
      <div className="mt-14 grid gap-10">
        {/* ABOUT */}
        <Card title="About Institute" icon={Building2}>
          {inst.description}
        </Card>

        {/* FOUNDER */}
        <Card title="Founder & Leadership" icon={BadgeCheck}>
          <p>
            <b>Founder:</b> {inst.founderName}
          </p>
          <p>
            <b>Designation:</b> {inst.designation}
          </p>
        </Card>

        {/* ACHIEVEMENTS */}
        <Card title="Achievements" icon={Award}>
          {["district", "state", "national"].map((lvl) => (
            <div key={lvl} className="mb-3">
              <h4 className="font-bold capitalize">{lvl}</h4>
<p className="flex items-center gap-2 flex-wrap">
  <span className="flex items-center gap-1">
    <img src="/gold-medal.png" className="w-4 h-4" alt="gold" />
    Gold: {inst.achievements?.[lvl]?.gold || 0}
  </span>

  <span className="flex items-center gap-1">
    <img src="/silver-medal.png" className="w-4 h-4" alt="silver" />
    Silver: {inst.achievements?.[lvl]?.silver || 0}
  </span>

  <span className="flex items-center gap-1">
    <img src="/bronze-medal.png" className="w-4 h-4" alt="bronze" />
    Bronze: {inst.achievements?.[lvl]?.bronze || 0}
  </span>
</p>
            </div>
          ))}
        </Card>

        {/* TRAINING PROGRAM */}
        <Card title="Training Program" icon={BookOpen}>
          {Object.entries(inst.trainingProgram || {}).map(([k, v]) => (
            <p key={k}>
              <b>{k}:</b> {v}
            </p>
          ))}
        </Card>

        {/* PRICING */}
        <Card title="Pricing & Fees" icon={Wallet}>
          <p>Monthly Fees: ₹{inst.pricing?.monthlyFees}</p>
          <p>Registration Fees: ₹{inst.pricing?.registrationFees}</p>
          <p>Uniform Cost: ₹{inst.pricing?.uniformCost}</p>
          <p>Payment Methods: {inst.pricing?.paymentMethods}</p>
          <p>Refund Policy: {inst.pricing?.refundPolicy}</p>
        </Card>

        {/* POLICIES */}
        <Card title="Policies & Agreements" icon={ShieldCheck}>
          <p>
            Merchant Policy: {inst.agreements?.merchantPolicy ? "✅" : "❌"}
          </p>
          <p>Payment Policy: {inst.agreements?.paymentPolicy ? "✅" : "❌"}</p>
          <p>Privacy Policy: {inst.agreements?.privacyPolicy ? "✅" : "❌"}</p>
          <p>
            Terms & Conditions:{" "}
            {inst.agreements?.termsAndConditions ? "✅" : "❌"}
          </p>
        </Card>

        {/* MEDIA */}
        <Card title="Media Gallery" icon={Star}>
          <MediaGrid
            title="Training Images"
            data={inst.mediaGallery?.trainingImages}
          />
          <MediaGrid
            title="Facility Images"
            data={inst.mediaGallery?.facilityImages}
          />
          <MediaGrid
            title="Equipment Images"
            data={inst.mediaGallery?.equipmentImages}
          />
          <MediaGrid
            title="Uniform Images"
            data={inst.mediaGallery?.uniformImages}
          />
        </Card>
      </div>
    </motion.div>
  );
}

/* COMPONENTS */

const Card = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl shadow-md p-6">
    <h2 className="flex items-center gap-2 text-xl font-bold text-orange-600 mb-4">
      {Icon && <Icon size={20} />} {title}
    </h2>
    <div className="text-gray-700 space-y-2">{children}</div>
  </div>
);

const MediaGrid = ({ title, data }) => {
  if (!data?.length) return null;
  return (
    <div className="mb-5">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.map((url, i) => (
          <img
            key={i}
            src={url}
            className="rounded-xl h-40 w-full object-cover border"
          />
        ))}
      </div>
    </div>
  );
};

const InfoGrid = ({ inst }) => (
  <div className="grid md:grid-cols-2 gap-4">
    <InfoItem
      icon={MapPin}
      label="Location"
      value={`${inst.city}, ${inst.state}`}
    />
    <InfoItem
      icon={Users}
      label="Students"
      value={inst.customers?.length || 0}
    />
    <InfoItem
      icon={UserCheck}
      label="Trainers"
      value={inst.trainers?.length || 0}
    />
    <InfoItem icon={Calendar} label="Founded" value={inst.yearFounded} />
    <InfoItem icon={Landmark} label="District" value={inst.district} />
    <InfoItem
      icon={CreditCard}
      label="UPI"
      value={inst.upiDetails || "Not Provided"}
    />
  </div>
);

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 bg-gray-100 p-4 rounded-xl">
    <Icon className="text-orange-500" />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  </div>
);

/* BUTTON STYLES */
const style = document.createElement("style");
style.innerHTML = `
.btn-primary{display:flex;justify-content:center;align-items:center;gap:8px;padding:12px;border-radius:14px;background:#ff7a00;color:white;font-weight:600}
.btn-success{display:flex;justify-content:center;align-items:center;gap:8px;padding:12px;border-radius:14px;background:#16a34a;color:white;font-weight:600}
.btn-outline{display:flex;justify-content:center;align-items:center;gap:8px;padding:12px;border-radius:14px;border:2px solid #ff7a00;color:#ff7a00;font-weight:600}
`;
document.head.appendChild(style);
