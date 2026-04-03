import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
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
  const [feedbacks, setFeedbacks] = useState([]);
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
  useEffect(() => {
    const loadFeedbacks = async () => {
      const q = query(
        collection(db, "feedbacks"),
        where("instituteId", "==", id),
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setFeedbacks(data);
    };

    loadFeedbacks();
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
      className="min-h-screen bg-gray-50 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 py-8"
    >
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-orange-600 font-semibold mb-6 hover:gap-3 transition-all"
      >
        <ArrowLeft size={20} /> Back
      </button>

      {/* HEADER */}
      <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8">
        {/* TOP ROW */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* LEFT SIDE - Logo + Name */}
          <div className="flex items-center gap-5">
            <img
              src={inst.profileImageUrl}
              className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-orange-400"
            />
            <h1 className="text-3xl lg:text-4xl font-extrabold text-[#ff7a00] mt-5">
              {inst.instituteName}
            </h1>
            <div className="flex gap-1 mt-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  onClick={() => handleRating(s)}
                  className={`text-2xl cursor-pointer ${
                    inst.ratingsByUser?.[auth.currentUser?.uid] >= s
                      ? "text-yellow-400"
                      : "text-gray-300 hover:text-yellow-300"
                  }`}
                >
                  ⭐
                </span>
              ))}
            </div>

            <p className="text-sm font-semibold mt-1">
              {inst.rating?.toFixed(1) || "0.0"} ⭐ ({inst.ratingCount || 0}{" "}
              reviews)
            </p>
          </div>

          {/* RIGHT SIDE - Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`/book-demo/${inst.id}`)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2"
            >
              <Calendar size={16} />
              Book a Slot
            </button>

            <a
              href={`tel:${inst.phoneNumber}`}
              className="border border-orange-500 text-orange-600 px-5 py-2 rounded-lg font-semibold flex items-center gap-2"
            >
              <Phone size={16} />
              Call Now
            </a>

            {auth.currentUser && (
              <button
                onClick={() => startInstituteChat()}
                className="border border-orange-500 text-orange-600 px-5 py-2 rounded-lg font-semibold flex items-center gap-2"
              >
                Chat Now
              </button>
            )}
            <button
              onClick={() => {
                localStorage.setItem("instituteId", inst.id); // ✅ save id
                navigate("/feedback"); // ✅ open feedback page
              }}
              className="border border-orange-500 text-orange-600 px-5 py-2 rounded-lg font-semibold"
            >
              Give Feedback
            </button>
          </div>
        </div>

        {/* INFO BOXES ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <InfoItem icon={MapPin} label="Location" value={inst.city} />
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
        </div>
      </div>

      {/* SECTIONS */}
      <div className="mt-14 grid gap-8">
        {/* ABOUT */}
        <Card title="About Institute" icon={Building2}>
          <div className="whitespace-pre-line">{inst.description}</div>
        </Card>

        {/* FOUNDER */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card title="Founder & Leadership">
            <p>
              <span className="font-semibold">Founder :</span>{" "}
              {inst.founderName}
            </p>

            <p>
              <span className="font-semibold">Designation :</span>{" "}
              {inst.designation}
            </p>
          </Card>

          {/* ACHIEVEMENTS */}
          <Card title="Achievements">
            <p>
              <span className="font-semibold">District :</span> Gold{" "}
              {inst.achievements?.district?.gold || 0}, Silver{" "}
              {inst.achievements?.district?.silver || 0}, Bronze{" "}
              {inst.achievements?.district?.bronze || 0}
            </p>

            <p>
              <span className="font-semibold">State :</span> Gold{" "}
              {inst.achievements?.state?.gold || 0}, Silver{" "}
              {inst.achievements?.state?.silver || 0}, Bronze{" "}
              {inst.achievements?.state?.bronze || 0}
            </p>

            <p>
              <span className="font-semibold">National :</span> Gold{" "}
              {inst.achievements?.national?.gold || 0}, Silver{" "}
              {inst.achievements?.national?.silver || 0}, Bronze{" "}
              {inst.achievements?.national?.bronze || 0}
            </p>
          </Card>
        </div>

        {/* TRAINING PROGRAM */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card title="Training Program">
            <div className="space-y-2">
              <p>
                <span className="font-semibold">Age Group :</span>{" "}
                {inst.trainingProgram?.ageGroup || "-"}
              </p>
              <p>
                <span className="font-semibold">Program Name :</span>{" "}
                {inst.trainingProgram?.programName || "-"}
              </p>
              <p>
                <span className="font-semibold">Skill Level :</span>{" "}
                {inst.trainingProgram?.skillLevel || "-"}
              </p>
              <p>
                <span className="font-semibold">Seats Available :</span>{" "}
                {inst.trainingProgram?.seatsAvailable || "-"}
              </p>
              <p>
                <span className="font-semibold">Fees :</span> ₹{" "}
                {inst.trainingProgram?.fees || "-"}
              </p>
              <p>
                <span className="font-semibold">Duration :</span>{" "}
                {inst.trainingProgram?.duration || "-"}
              </p>
              <p>
                <span className="font-semibold">Trial Sessions :</span>{" "}
                {inst.trainingProgram?.trialSessions || "-"}
              </p>
              <p>
                <span className="font-semibold">Batch Timings :</span>{" "}
                {inst.trainingProgram?.batchTimings || "-"}
              </p>
            </div>
          </Card>

          {/* PRICING */}
          <Card title="Pricing & Fees">
            <div className="space-y-2">
              <p>
                <span className="font-semibold">Monthly Fees :</span> ₹{" "}
                {inst.pricing?.monthlyFees}
              </p>
              <p>
                <span className="font-semibold">Registration Fees :</span> ₹{" "}
                {inst.pricing?.registrationFees}
              </p>
              <p>
                <span className="font-semibold">Uniform Cost :</span> ₹{" "}
                {inst.pricing?.uniformCost}
              </p>
              <p>
                <span className="font-semibold">Payment Method :</span>{" "}
                {inst.pricing?.paymentMethods}
              </p>

              {inst.pricing?.refundPolicy && (
                <div className="mt-3 text-sm text-gray-600">
                  <span className="font-semibold text-orange-600">
                    Refund Policy :
                  </span>
                  <p className="mt-1 whitespace-pre-line">
                    {inst.pricing?.refundPolicy}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* POLICIES */}
        <Card title="Policies & Agreements">
          <p>
            <span className="font-semibold">Policies & Agreements :</span>{" "}
            {inst.agreements?.merchantPolicy &&
            inst.agreements?.paymentPolicy &&
            inst.agreements?.privacyPolicy &&
            inst.agreements?.termsAndConditions
              ? "Policies & Agreements include Merchant Policy, Payment Policy, Privacy Policy, and Terms & Conditions, all of which have been accepted."
              : "Policies & Agreements have not been fully accepted."}
          </p>
        </Card>
        <Card title="Location Map" icon={MapPin}>
          <div className="w-full h-[280px] md:h-[350px] rounded-xl overflow-hidden border">
            <iframe src={mapSrc} className="w-full h-full" loading="lazy" />
          </div>
        </Card>
        <div className="mt-14">
          <h2 className="text-3xl font-bold text-[#ff7a00] mb-6">
            Categories & Sub Categories
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(inst.categories || {}).map(([cat, subs]) => (
              <div
                key={cat}
                className="border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
              >
                <h3 className="font-bold text-lg mb-2">{cat}</h3>
                <ul className="list-disc ml-5 text-gray-700">
                  {subs.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
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
        {/* CUSTOMER REVIEWS */}
        <div className="mt-14">
          <h2 className="text-2xl font-bold text-orange-600 mb-6">
            Customer Reviews
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedbacks.length === 0 ? (
              <p className="text-gray-500">No reviews yet</p>
            ) : (
              feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-white border border-orange-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition"
                >
                  {/* Profile + Name */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gray-300"></div>

                    <div>
                      <h3 className="font-bold text-lg">{fb.name}</h3>
                      <p className="text-sm text-gray-500">Feedback</p>
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {fb.message}
                  </p>

                  {/* Bottom */}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* COMPONENTS */

const Card = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 md:p-8 hover:shadow-md transition">
    <h2 className="text-xl font-bold text-orange-600 mb-4">{title}</h2>
    <div className="text-gray-700 space-y-2">{children}</div>
  </div>
);

const MediaGrid = ({ title, data }) => {
  if (!data?.length) return null;
  return (
    <div className="mb-5">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
  <div className="flex items-center gap-3 bg-white border border-orange-200 p-4 rounded-xl shadow-sm hover:shadow-md transition">
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
