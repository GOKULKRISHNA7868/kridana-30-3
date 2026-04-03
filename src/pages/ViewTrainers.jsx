// src/pages/ViewTrainers.jsx
import React, { useEffect, useState, useMemo } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
/* 🌍 Distance Formula */
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function ViewTrainers() {
  const navigate = useNavigate();
  const location = useLocation();

  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  /* 📍 User location */
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  /* 🔹 Filters */
  const searchParams = new URLSearchParams(location.search);
  const defaultCategory = searchParams.get("category") || "";

  const defaultSubCategory = searchParams.get("subCategory") || "";
  const isSubCategoryFromURL = Boolean(defaultSubCategory);

  const [category, setCategory] = useState(defaultCategory);
  const [subCategory, setSubCategory] = useState(defaultSubCategory);

  const [city, setCity] = useState("");
  const [minRating, setMinRating] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);
  const categories = [
    "Martial Arts",
    "Team Ball Sports",
    "Racket Sports",
    "Fitness",
    "Target & Precision Sports",
    "Equestrian Sports",
    "Adventure & Outdoor Sports",
    "Ice Sports",
    "Aquatic Sports",
    "Wellness",
    "Dance",
  ];

  const subCategoryMap = {
    "Martial Arts": [
      "Karate",
      "Kung Fu",
      "Krav Maga",
      "Muay Thai",
      "Taekwondo",
      "Judo",
      "Brazilian Jiu-Jitsu",
      "Aikido",
      "Jeet Kune Do",
      "Capoeira",
      "Sambo",
      "Silat",
      "Kalaripayattu",
      "Hapkido",
      "Wing Chun",
      "Shaolin",
      "Ninjutsu",
      "Kickboxing",
      "Boxing",
      "Wrestling",
      "Shorinji Kempo",
      "Kyokushin",
      "Goju-ryu",
      "Shotokan",
      "Wushu",
      "Savate",
      "Lethwei",
      "Bajiquan",
      "Hung Gar",
      "Praying Mantis Kung Fu",
    ],
    "Team Ball Sports": [
      "Football / Soccer",
      "Basketball",
      "Handball",
      "Rugby",
      "Futsal",
      "Field Hockey",
      "Lacrosse",
      "Gaelic Football",
      "Volleyball",
      "Beach Volleyball",
      "Sepak Takraw",
      "Roundnet (Spikeball)",
      "Netball",
      "Cricket",
      "Baseball",
      "Softball",
      "Wheelchair Rugby",
      "Dodgeball",
      "Korfball",
    ],
    "Racket Sports": [
      "Tennis",
      "Table Tennis",
      "Badminton",
      "Squash",
      "Racquetball",
      "Padel",
      "Pickleball",
      "Platform Tennis",
      "Real Tennis",
      "Soft Tennis",
      "Frontenis",
      "Speedminton (Crossminton)",
      "Paddle Tennis (POP Tennis)",
      "Speed-ball",
      "Chaza",
      "Totem Tennis (Swingball)",
      "Matkot",
      "Jombola",
    ],
    Fitness: [
      "Gym Workout",
      "Weight Training",
      "Bodybuilding",
      "Powerlifting",
      "CrossFit",
      "Calisthenics",
      "Circuit Training",
      "HIIT",
      "Functional Training",
      "Core Training",
      "Mobility Training",
      "Stretching",
      "Resistance Band Training",
      "Kettlebell Training",
      "Boot Camp Training",
      "Spinning",
      "Step Fitness",
      "Pilates",
      "Yoga",
    ],
    "Target & Precision Sports": [
      "Archery",
      "Golf",
      "Bowling",
      "Darts",
      "Snooker",
      "Pool",
      "Billiards",
      "Target Shooting",
      "Clay Pigeon Shooting",
      "Air Rifle Shooting",
      "Air Pistol Shooting",
      "Croquet",
      "Petanque",
      "Bocce",
      "Lawn Bowls",
      "Carom Billiards",
      "Nine-Pin Bowling",
      "Disc Golf",
      "Kubb",
      "Pitch and Putt",
      "Shove Ha’penny",
      "Toad in the Hole",
      "Bat and Trap",
      "Boccia",
      "Gateball",
    ],
    "Equestrian Sports": [
      "Horse Racing",
      "Barrel Racing",
      "Rodeo",
      "Mounted Archery",
      "Tent Pegging",
    ],
    "Adventure & Outdoor Sports": [
      "Rock Climbing",
      "Mountaineering",
      "Trekking",
      "Hiking",
      "Mountain Biking",
      "Sandboarding",
      "Orienteering",
      "Obstacle Course Racing",
      "Skydiving",
      "Paragliding",
      "Hang Gliding",
      "Parachuting",
      "Hot-air Ballooning",
      "Skiing",
      "Snowboarding",
      "Ice Climbing",
      "Heli-skiing",
      "Bungee Jumping",
      "BASE Jumping",
      "Canyoning",
      "Kite Buggy",
      "Zorbing",
      "Zip Lining",
    ],
    "Aquatic Sports": [
      "Swimming",
      "Water Polo",
      "Surfing",
      "Scuba Diving",
      "Snorkeling",
      "Freediving",
      "Kayaking",
      "Canoeing",
      "Rowing",
      "Sailing",
      "Windsurfing",
      "Kite Surfing",
      "Jet Skiing",
      "Wakeboarding",
      "Water Skiing",
      "Stand-up Paddleboarding",
      "Whitewater Rafting",
      "Dragon Boat Racing",
      "Artistic Swimming",
      "Open Water Swimming",
    ],
    "Ice Sports": [
      "Ice Skating",
      "Figure Skating",
      "Ice Hockey",
      "Speed Skating",
      "Ice Dance",
      "Synchronized Skating",
      "Curling",
      "Broomball",
      "Bobsleigh",
      "Skiboarding",
      "Ice Dragon Boat Racing",
      "Ice Cross Downhill",
    ],
    Wellness: [
      "Yoga & Meditation",
      "Spa & Relaxation",
      "Mental Wellness",
      "Fitness",
      "Nutrition",
      "Traditional & Alternative Therapies",
      "Rehabilitation",
      "Lifestyle Coaching",
    ],
    Dance: [
      "Bharatanatyam",
      "Kathak",
      "Kathakali",
      "Kuchipudi",
      "Odissi",
      "Mohiniyattam",
      "Manipuri",
      "Sattriya",
      "Chhau",
      "Yakshagana",
      "Lavani",
      "Ghoomar",
      "Kalbelia",
      "Garba",
      "Dandiya Raas",
      "Bhangra",
      "Bihu",
      "Dollu Kunitha",
      "Theyyam",
      "Ballet",
      "Contemporary",
      "Hip Hop",
      "Breakdance",
      "Jazz Dance",
      "Tap Dance",
      "Modern Dance",
      "Street Dance",
      "House Dance",
      "Locking",
      "Popping",
      "Krumping",
      "Waacking",
      "Voguing",
      "Salsa",
      "Bachata",
      "Merengue",
      "Cha-Cha",
      "Rumba",
      "Samba",
      "Paso Doble",
      "Jive",
      "Tango",
      "Waltz",
      "Foxtrot",
      "Quickstep",
      "Flamenco",
      "Irish Stepdance",
      "Scottish Highland Dance",
      "Morris Dance",
      "Hula",
      "Maori Haka",
      "African Tribal Dance",
      "Zumba",
      "K-Pop Dance",
      "Shuffle Dance",
      "Electro Dance",
      "Pole Dance",
      "Ballroom Dance",
      "Line Dance",
      "Square Dance",
      "Folk Dance",
      "Contra Dance",
    ],
  };
  /* 🔐 Fetch trainers */
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const snap = await getDocs(collection(db, "trainers"));
        setTrainers(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            profileImageUrl: d.data().profileImageUrl || "",
          })),
        );
      } catch (err) {
        console.error("Error fetching trainers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainers();
  }, []);

  /* 📍 Get Current Location */
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      () => alert("Location access denied"),
    );
  };

  /* 🔹 Filtered & Sorted Trainers */
  const filteredTrainers = useMemo(() => {
    return trainers
      .filter((t) => {
        if (category && !t.categories?.[category?.trim()]) return false;

        if (
          subCategory &&
          !t.categories?.[category?.trim()]?.includes(subCategory?.trim())
        )
          return false;

        if (city && t.city?.trim() !== city.trim()) return false;

        if (minRating && (t.rating || 0) < Number(minRating)) return false;

        return true;
      })
      .map((t) => {
        const lat = userLat ?? Number(manualLat);
        const lng = userLng ?? Number(manualLng);
        if (!lat || !lng || !t.latitude || !t.longitude) return t;
        return {
          ...t,
          distance: getDistanceKm(
            lat,
            lng,
            Number(t.latitude),
            Number(t.longitude),
          ),
        };
      })
      .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
  }, [
    trainers,
    category,
    subCategory,
    city,
    minRating,
    userLat,
    userLng,
    manualLat,
    manualLng,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-semibold">
        Loading Trainers...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white px-6 md:px-16 py-12">
      <h1 className="text-4xl font-bold text-[#ff7a00] mb-8">Trainers</h1>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-[repeat(5,minmax(180px,1fr))] gap-3 mb-8">
        {/* Category */}

        {/* CATEGORY CUSTOM DROPDOWN */}
        <div className="relative">
          <div
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className={`w-full flex items-center justify-between bg-white 
    border ${showCategoryDropdown ? "border-orange-500" : "border-gray-300"} 
    rounded-md px-3 h-[45px] cursor-pointer`}
          >
            <span className={category ? "text-black" : "text-gray-400"}>
              {category === "" ? "Select Category" : category}
            </span>
            <ChevronDown size={18} />
          </div>

          {showCategoryDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow max-h-[180px] overflow-y-auto">
              {categories.map((cat) => (
                <div
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setSubCategory("");
                    setShowCategoryDropdown(false);
                  }}
                  className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer"
                >
                  {cat}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subcategory */}

        {/* SUBCATEGORY CUSTOM DROPDOWN */}
        <div className="relative">
          <div
            onClick={() =>
              category && setShowSubCategoryDropdown(!showSubCategoryDropdown)
            }
            className={`w-full flex items-center justify-between bg-white 
    border ${showSubCategoryDropdown ? "border-orange-500" : "border-gray-300"} 
    rounded-md px-3 h-[45px] 
    ${!category && "cursor-not-allowed opacity-50"}`}
          >
            <span className={subCategory ? "text-black" : "text-gray-400"}>
              {subCategory === "" ? "Select Sub Category" : subCategory}
            </span>
            <ChevronDown size={18} />
          </div>

          {showSubCategoryDropdown && category && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow max-h-[180px] overflow-y-auto">
              {(subCategoryMap[category?.trim()] || []).map((sub) => (
                <div
                  key={sub}
                  onClick={() => {
                    setSubCategory(sub.trim()); // ✅ ONLY THIS
                    setShowSubCategoryDropdown(false); // close dropdown
                  }}
                  className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer"
                >
                  {sub}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* City */}
        <select
          className="border h-[42px] px-3 rounded-md text-sm bg-white"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          <option value="">All Cities</option>
          {[
            ...new Set(
              trainers
                .map((t) => t.city?.trim()) // 🔥 REMOVE SPACE
                .filter(Boolean),
            ),
          ]
            .sort((a, b) => a.localeCompare(b)) // 🔥 ALPHABETICAL ORDER
            .map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
        </select>

        {/* Min Rating */}
        <select
          className="border h-[42px] px-3 rounded-md text-sm bg-white"
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
        >
          <option value="">Any Rating</option>
          <option value="3">3★+</option>
          <option value="4">4★+</option>
        </select>

        {/* Location */}
        <div className="flex gap-2">
          <button
            onClick={getCurrentLocation}
            className=" text-black h-[40px] px-4 rounded-md text-sm"
          >
            Current Location
          </button>
          <input
            type="number"
            placeholder="Lat"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            className="border h-[40px] px-2 rounded-md w-[70px] text-sm"
          />
          <input
            type="number"
            placeholder="Lng"
            value={manualLng}
            onChange={(e) => setManualLng(e.target.value)}
            className="border h-[40px] px-2 rounded-md w-[70px] text-sm"
          />
        </div>
      </div>

      {/* TRAINER LIST */}
      {filteredTrainers.length === 0 ? (
        <div className="text-center mt-19">
          <img
            src="/institue.png"
            alt="No trainers"
            className="mx-auto w-32 mb-4 opacity-80"
          />
          <h1 className="text-2xl font-bold mb-2">
            Trainers will be available shortly
          </h1>
          <p className="text-gray-500 text-xl">
            We're currently updating our trainer listings. Please check back
            soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-20">
          {filteredTrainers.map((t) => (
            <div
              key={t.id}
              onClick={() => navigate(`/trainers/${t.id}`)}
              className="bg-white rounded-[18px] shadow-lg border cursor-pointer hover:scale-[1.02] transition-transform"
            >
              {/* PROFILE IMAGE */}
              <div className="h-[160px] rounded-t-[18px] overflow-hidden flex items-center justify-center bg-white">
                {t.profileImageUrl ? (
                  <img
                    src={t.profileImageUrl}
                    alt={t.trainerName || `${t.firstName} ${t.lastName}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-white" />
                )}
              </div>

              <div className="p-4 text-center">
                <h2 className="text-lg font-bold">
                  {t.trainerName || `${t.firstName} ${t.lastName}`}
                </h2>
                <p className="text-gray-500">
                  {t.city}, {t.state}
                </p>
                {t.distance !== undefined && (
                  <p className="font-semibold text-sm mt-1">
                    📏 {t.distance.toFixed(2)} km away
                  </p>
                )}
                <p className="text-sm font-semibold mt-1 flex items-center justify-center gap-1">
                  {t.rating ? (
                    <>
                      <span className="text-yellow-500">⭐</span>
                      {t.rating.toFixed(1)}
                      {t.ratingCount ? `(${t.ratingCount})` : ""}
                    </>
                  ) : (
                    <>
                      <span className="text-gray-400">☆</span>
                      <span className="text-gray-400">No ratings</span>
                    </>
                  )}
                </p>
                <button className="mt-3 w-full bg-[#ff7a00] text-white py-2 rounded-lg text-sm">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
