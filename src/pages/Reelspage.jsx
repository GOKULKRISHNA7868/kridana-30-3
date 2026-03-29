import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2 } from "lucide-react";

const TrendingReelsPage = () => {
  const [reels, setReels] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      let allReels = [];

      /* ---------------- TRAINERS REELS ---------------- */

      const trainersSnap = await getDocs(collection(db, "trainers"));

      for (let trainerDoc of trainersSnap.docs) {
        const data = trainerDoc.data();

        if (data.reels && data.reels.length > 0) {
          data.reels.forEach((videoUrl, index) => {
            const reelId = `trainer_${trainerDoc.id}_${index}`;

            allReels.push({
              reelId,
              videoUrl,
              ownerId: trainerDoc.id,
              ownerType: "trainer",
              profileName: data.name || "Trainer",
              profileImage: data.profileImageUrl || "",
            });
          });
        }
      }

      /* ---------------- INSTITUTE REELS ---------------- */

      const institutesSnap = await getDocs(collection(db, "institutes"));

      for (let instDoc of institutesSnap.docs) {
        const data = instDoc.data();

        if (data.reels && data.reels.length > 0) {
          data.reels.forEach((videoUrl, index) => {
            const reelId = `institute_${instDoc.id}_${index}`;

            allReels.push({
              reelId,
              videoUrl,
              ownerId: instDoc.id,
              ownerType: "institute",
              profileName: data.name || "Institute",
              profileImage: data.profileImageUrl || "",
            });
          });
        }
      }

      /* ---------------- GET ANALYTICS ---------------- */

      const reelsWithStats = await Promise.all(
        allReels.map(async (reel) => {
          const reelDoc = await getDoc(doc(db, "reels", reel.reelId));

          if (reelDoc.exists()) {
            const stats = reelDoc.data();
            return {
              ...reel,
              views: stats.views || 0,
              likes: stats.likes || 0,
              dislikes: stats.dislikes || 0,
            };
          }

          return {
            ...reel,
            views: 0,
            likes: 0,
            dislikes: 0,
          };
        }),
      );

      setReels(reelsWithStats);
    } catch (error) {
      console.error("Error fetching reels:", error);
    }
  };

  /* ---------------- OPEN REEL PAGE ---------------- */

  const openReel = (index) => {
    navigate(`/reels/${index}`, {
      state: { reels },
    });
  };
  const formatNumber = (num) => {
    if (!num) return 0;

    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }

    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }

    return num;
  };
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* HEADER */}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Trending Plays</h1>

        <div className="flex gap-4">
          <input
            placeholder="Search..."
            className="border rounded-full px-4 py-2 w-64"
          />

          <button className="bg-orange-500 text-white px-6 py-2 rounded-lg">
            Watch More
          </button>
        </div>
      </div>

      {/* GRID */}

      <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
        {reels.map((reel, index) => (
          <div
            key={index}
            className="relative cursor-pointer group"
            onClick={() => openReel(index)}
          >
            {/* VIDEO */}

            <video
              src={reel.videoUrl}
              className="w-full rounded-xl"
              muted
              preload="metadata"
            />

            {/* VIEWS */}

            <div className="absolute top-2 right-2 bg-white text-black text-xs px-2 py-1 rounded-full">
              {formatNumber(reel.views)} Views
            </div>

            {/* BOTTOM INFO */}

            <div className="absolute bottom-0 left-0 right-0 p-3 text-white bg-gradient-to-t from-black/70 to-transparent rounded-b-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-white"></div>

                <span className="text-sm font-semibold">
                  {reel.profileName}
                </span>

                <button className="ml-auto bg-orange-500 text-xs px-2 py-1 rounded">
                  Follow
                </button>
              </div>
              <div className="flex gap-4 text-sm items-center">
                <div className="flex items-center gap-1">
                  <Heart size={18} />
                  <span>{formatNumber(reel.likes)}</span>
                </div>

                <div className="flex items-center gap-1">
                  <MessageCircle size={18} />
                  <span>{formatNumber(reel.dislikes)}</span>
                </div>

                <Share2 size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingReelsPage;
