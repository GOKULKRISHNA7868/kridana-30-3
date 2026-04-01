import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  getDoc,
  doc,
} from "firebase/firestore";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { ChevronDown } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
const AnalyticsPage = () => {
  const user = auth.currentUser;

  const [reels, setReels] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [graphData, setGraphData] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [topReels, setTopReels] = useState([]);
  const [activeTab, setActiveTab] = useState("views");
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [employeeStats, setEmployeeStats] = useState({
    joined: 0,
    left: 0,
  });

  const [customerStats, setCustomerStats] = useState({
    joined: 0,
    left: 0,
  });
  const downloadPDFReport = async () => {
    const container = document.createElement("div");

    container.style.width = "794px";
    container.style.padding = "40px";
    container.style.margin = "0 auto";
    container.style.background = "white";
    container.style.fontFamily = "Arial";

    container.innerHTML = `
  
 <h1 style="text-align:center;margin-bottom:15px">
Trainer Revenue Report
</h1>

  <p>
  Year: ${selectedYear} <br/>
 Months: ${new Date(0, startMonth).toLocaleString("default", { month: "short" })}
-
${new Date(0, endMonth).toLocaleString("default", { month: "short" })}
  </p>

<h3 style="text-align:center;margin-bottom:25px">
Total Revenue: ₹${totalRevenue.toLocaleString()}
</h3>

 <table style="width:80%;margin:0 auto;border-collapse:collapse;font-size:14px">

  <thead>
  <tr>
<tr style="background:#f3f3f3">
<th style="border:1px solid #ddd;padding:10px;text-align:center">Month</th>
<th style="border:1px solid #ddd;padding:10px;text-align:center">Revenue</th>
  </tr>
  </thead>

  <tbody>

  ${graphData
    .map(
      (r) => `
      <tr>
<td style="border:1px solid #ddd;padding:10px;text-align:center">${r.month}</td>
<td style="border:1px solid #ddd;padding:10px;text-align:center">₹ ${r.revenue}</td>
      </tr>
      `,
    )
    .join("")}

  </tbody>
  </table>
  `;

    document.body.appendChild(container);

    const canvas = await html2canvas(container, { scale: 2 });

    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(img, "PNG", 10, 10, imgWidth, imgHeight);

    pdf.save(`Trainer_Revenue_${selectedYear}.pdf`);

    document.body.removeChild(container);
  };
  /* ================= FETCH TOP REELS (DYNAMIC LOGIN BASED) ================= */
  useEffect(() => {
    if (!user) return;

    const fetchTopReels = async () => {
      try {
        let ownerType = null;
        let ownerDoc = null;

        // Detect institute login
        const instituteDoc = await getDoc(doc(db, "institutes", user.uid));
        if (instituteDoc.exists()) {
          ownerType = "institute";
          ownerDoc = instituteDoc;
        }

        // Detect trainer login
        if (!ownerType) {
          const trainerDoc = await getDoc(doc(db, "trainers", user.uid));
          if (trainerDoc.exists()) {
            ownerType = "trainer";
            ownerDoc = trainerDoc;
          }
        }

        if (!ownerType || !ownerDoc) {
          // fallback static
          return;
        }

        const tasks = [];
        const data = ownerDoc.data();
        const ownerId = ownerDoc.id;

        console.log("🔥 REELS ARRAY:", data.reels); // DEBUG

        if (Array.isArray(data.reels)) {
          for (let idx = 0; idx < data.reels.length; idx++) {
            const reelId = `${ownerType}_${ownerId}_${idx}`;
            const videoUrl = data.reels[idx]; // ✅ THIS IS CLOUDINARY URL

            console.log("🎯 MAPPING:", reelId, videoUrl); // DEBUG

            tasks.push(
              Promise.all([
                getDocs(
                  query(
                    collection(db, "reelViews"),
                    where("reelId", "==", reelId),
                  ),
                ),
                getDocs(
                  query(
                    collection(db, "reelLikes"),
                    where("reelId", "==", reelId),
                  ),
                ),
                getDocs(
                  query(
                    collection(db, "reelDislikes"),
                    where("reelId", "==", reelId),
                  ),
                ),
                getDocs(collection(db, "reelComments", reelId, "comments")),
                getDocs(
                  query(
                    collection(db, "profileViews"),
                    where("ownerId", "==", ownerId),
                  ),
                ), // ✅ REAL PROFILE VIEWS
              ]).then(
                ([
                  viewsSnap,
                  likesSnap,
                  dislikeSnap,
                  commentsSnap,
                  profileSnap,
                ]) => ({
                  reelId,
                  title: data.instituteName || data.trainerName || "Reel",
                  videoUrl,
                  views: viewsSnap.size || 0,
                  likes: likesSnap.size || 0,
                  dislikes: dislikeSnap.size || 0,
                  comments: commentsSnap.size || 0,
                  profileViews: profileSnap.size || 0, // ✅ REAL DATA
                }),
              ),
            );
          }
        }

        const reelStats = await Promise.all(tasks);
        setTopReels(reelStats);

        /* ================= VIDEO API ================= */

        if (reelStats.length === 0) return; // fallback to static UI

        if (activeTab === "views") reelStats.sort((a, b) => b.views - a.views);
        if (activeTab === "likes") reelStats.sort((a, b) => b.likes - a.likes);
        if (activeTab === "comments")
          reelStats.sort((a, b) => b.comments - a.comments);
        if (activeTab === "dislikes")
          reelStats.sort((a, b) => b.dislikes - a.dislikes);

        setTopReels(reelStats);
      } catch (err) {
        console.error("Dynamic reel analytics error:", err);
      }
    };

    fetchTopReels();
  }, [user, activeTab]);
  const handlePlayReel = (videoUrl) => {
    setActiveVideoUrl(videoUrl);
    setShowVideoPopup(true);
  };
  /* ================= WORKFORCE (STATIC SAFE) ================= */
  /* ================= WORKFORCE (STATIC SAFE) ================= */
  useEffect(() => {
    if (!user) return;

    const fetchWorkforce = async () => {
      const studentsSnap = await getDocs(
        query(
          collection(db, "trainerstudents"),
          where("trainerId", "==", user.uid),
        ),
      );

      setCustomerStats({
        joined: studentsSnap.size || 0,
        left: 0,
      });
    };

    fetchWorkforce();
  }, [user]);
  /* ================= GRAPH REVENUE FROM FIRESTORE ================= */
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  useEffect(() => {
    if (!user || startMonth === "" || endMonth === "") return;

    const fetchGraphData = async () => {
      try {
        setLoadingRevenue(true);

        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];

        const revenueMap = {};

        for (let i = 0; i < 12; i++) {
          revenueMap[i] = 0;
        }

        const feesSnap = await getDocs(
          query(
            collection(db, "institutesFees"),
            where("trainerId", "==", user.uid),
            where("year", "==", String(selectedYear)), // 🔥 FIX
          ),
        );

        feesSnap.forEach((doc) => {
          const data = doc.data();

          const monthIndex = parseInt(data.month) - 1;

          if (monthIndex >= startMonth && monthIndex <= endMonth) {
            revenueMap[monthIndex] += Number(data.paidAmount || 0);
          }
        });

        const graph = [];

        for (let m = Number(startMonth); m <= Number(endMonth); m++) {
          graph.push({
            month: months[m],
            revenue: revenueMap[m] || 0,
          });
        }

        setGraphData(graph);
      } catch (err) {
        console.error("Revenue fetch error:", err);
      } finally {
        setLoadingRevenue(false);
      }
    };

    fetchGraphData();
  }, [user, selectedYear, startMonth, endMonth]);
  /* ================= PAYROLL CALCULATIONS ================= */
  const highestMonth = graphData.reduce(
    (max, item) => (item.revenue > max.revenue ? item : max),
    graphData[0] || { revenue: 0 },
  );

  const lowestMonth = graphData.reduce(
    (min, item) => (item.revenue < min.revenue ? item : min),
    graphData[0] || { revenue: 0 },
  );

  const totalRevenue = graphData.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 relative">
        <h1 className="text-3xl font-bold">Growth & Performance Overview</h1>
        <div className="flex gap-4 mb-6">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border px-3 py-2 rounded"
          >
            {[2026, 2025, 2024, 2023].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="">From Month</option>
            {[...Array(12)].map((_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleString("default", { month: "short" })}
              </option>
            ))}
          </select>

          <select
            value={endMonth}
            onChange={(e) => setEndMonth(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="">To Month</option>
            {[...Array(12)].map((_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleString("default", { month: "short" })}
              </option>
            ))}
          </select>

          <button
            onClick={downloadPDFReport}
            className="bg-orange-500 text-white px-4 py-2 rounded"
          >
            Download Report
          </button>
        </div>
      </div>

      {/* ================= UI BELOW UNCHANGED ================= */}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="border p-4 rounded-lg bg-orange-50">
          <p>Profile Views</p>
          <p className="text-xl font-bold text-orange-600">
            {topReels.reduce((s, r) => s + Number(r.profileViews || 0), 0)}
          </p>
        </div>
        <div className="border p-4 rounded-lg bg-orange-50">
          <p>Video Views</p>
          <p className="text-xl font-bold text-orange-600">
            {topReels.reduce((s, r) => s + r.views, 0)}
          </p>
        </div>
        <div className="border p-4 rounded-lg bg-orange-50">
          <p>likes</p>
          <p className="text-xl font-bold text-red-500">
            {topReels.reduce((s, r) => s + r.likes, 0)}
          </p>
        </div>
        <div className="border p-4 rounded-lg bg-orange-50">
          <p>Dislikes</p>
          <p className="text-xl font-bold text-orange-600">
            {topReels.reduce((s, r) => s + r.dislikes, 0)}
          </p>
        </div>
      </div>

      {/* TOP CONTENT INSIGHTS */}
      <div className="bg-gray-50 border rounded-xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-6">Top Content Insights</h2>

        {/* TABS */}
        <div className="flex gap-8 border-b mb-6">
          {["views", "likes", "dislikes", "comments"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 capitalize ${
                activeTab === tab
                  ? "text-orange-600 border-b-2 border-orange-600 font-semibold"
                  : "text-gray-600"
              }`}
            >
              {`Most ${tab}`}
            </button>
          ))}
        </div>

        {/* TABLE */}
        <div className="grid grid-cols-6 font-semibold text-orange-600 mb-4">
          <div>Videos</div>
          <div>Title</div>
          <div>Views</div>
          <div>Likes</div>
          <div>Dislikes</div>
          <div>Comments</div>
        </div>

        {topReels.slice(0, 5).map((reel, i) => (
          <div key={i} className="grid grid-cols-6 items-center py-4 border-t">
            <div
              onClick={() => handlePlayReel(reel.videoUrl)} // ✅ Now this works
              className="w-20 h-14 bg-gray-300 rounded-md cursor-pointer flex items-center justify-center text-xs font-semibold"
            >
              ▶ Play
            </div>

            <div>{reel.title}</div>
            <div>{reel.views}</div>
            <div>{reel.likes}</div>
            <div>{reel.dislikes}</div>
            <div>{reel.comments}</div>
          </div>
        ))}
        {showVideoPopup && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-black rounded-xl p-4 w-[90%] max-w-[500px] relative">
              <button
                onClick={() => {
                  setShowVideoPopup(false);
                  setActiveVideoUrl(null);
                }}
                className="absolute top-2 right-2 text-white text-xl"
              >
                ✕
              </button>

              <video
                src={activeVideoUrl}
                controls
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
            </div>
          </div>
        )}
      </div>

      {/* GRAPHS */}
      <h2 className="text-xl font-semibold mt-5 mb-4">Revenue Reports</h2>

      <div className="bg-white shadow rounded-lg p-5 mt-10">
        {loadingRevenue ? (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>

            <p className="mt-4 text-gray-500">Fetching revenue analytics...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={graphData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <h2 className="text-xl font-semibold mt-10 mb-4">Payroll Overview</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {/* LEFT SIDE GRAPH */}
        <div className="md:col-span-2 bg-white shadow rounded-lg p-5">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={graphData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#f97316" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* RIGHT SIDE CARDS */}
        <div className="flex flex-col gap-5">
          {/* Highest Paying */}
          <div className="bg-white border border-orange-200 shadow rounded-lg p-5">
            <p className="text-green-600 font-semibold text-sm">
              Highest Paying
            </p>
            <h3 className="text-2xl font-bold">
              ₹ {highestMonth?.revenue?.toLocaleString()}
            </h3>
            <p className="text-gray-600">{highestMonth?.month}</p>
          </div>

          {/* Lowest Paying */}
          <div className="bg-white border border-orange-200 shadow rounded-lg p-5">
            <p className="text-red-500 font-semibold text-sm">Lowest Paying</p>
            <h3 className="text-2xl font-bold">
              ₹ {lowestMonth?.revenue?.toLocaleString()}
            </h3>
            <p className="text-gray-600">{lowestMonth?.month}</p>
          </div>

          {/* Total Paying */}
          <div className="bg-white border border-orange-200 shadow rounded-lg p-5">
            <p className="text-gray-600 font-semibold text-sm">Total Paying</p>
            <h3 className="text-2xl font-bold">
              ₹ {totalRevenue.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* WORKFORCE */}
      <div className="bg-gray-50 border rounded-xl p-6 mt-10 shadow-sm">
        <h2 className="text-2xl font-bold mb-6">Workforce & Clients Metrics</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border p-6 rounded-xl bg-white">
            <h3 className="text-xl font-semibold">Customers</h3>
            <p>Joined: {customerStats.joined}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
