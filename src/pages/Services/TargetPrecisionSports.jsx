import React from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

const TargetPrecisionPage = () => {
  const navigate = useNavigate();
  const [selectedSubCategory, setSelectedSubCategory] = React.useState(null);
  const [showChoice, setShowChoice] = React.useState(false);
      const [searchTerm, setSearchTerm] = React.useState("");

  const categories = [
    { name: "Archery", desc: "Develop focus, control, and precision with bow and arrow.", image: "/images/archery.jpeg" },
    { name: "Golf", desc: "Refined sport focused on precision, patience, and technique.", image: "/images/golf.jpeg" },
    { name: "Bowling", desc: "Strategic target sport combining power and finesse.", image: "/images/bowling.jpeg" },
    { name: "Darts", desc: "Precision-based sport that sharpens hand–eye coordination.", image: "/images/darts.jpeg" },
    { name: "Snooker", desc: "Cue sport emphasizing strategy, angles, and accuracy.", image: "/images/snooker.jpeg" },
    { name: "Pool", desc: "Fast-paced cue sport demanding accuracy and control.", image: "/images/pool.jpeg" },
    { name: "Billiards", desc: "Table sport emphasizing angles, control, and accuracy.", image: "/images/billiards.jpeg" },
    { name: "Target Shooting", desc: "Master focus and aim across precision shooting formats.", image: "/images/target-shooting.jpeg" },
    { name: "Clay Pigeon Shooting", desc: "Test reflexes and tracking skills with moving targets.", image: "/images/clay-pigeon-shooting.jpeg" },
    { name: "Air Rifle Shooting", desc: "Precision shooting using controlled air rifles.", image: "/images/air-rifle-shooting.jpeg" },
    { name: "Air Pistol Shooting", desc: "Refine steadiness and discipline with pistol precision.", image: "/images/air-pistol-shooting.jpeg" },
    { name: "Croquet", desc: "Outdoor target game focused on tactical ball placement.", image: "/images/croquet.jpeg" },
    { name: "Petanque", desc: "French precision sport built on aim and control.", image: "/images/petanque.jpeg" },
    { name: "Bocce", desc: "Traditional precision sport built on strategy and control.", image: "/images/bocce.jpeg" },
    { name: "Lawn Bowls", desc: "Target-based outdoor precision sport testing consistency.", image: "/images/lawn-bowls.jpeg" },
    { name: "Carom Billiards", desc: "Advanced billiards variation emphasizing rebound angles.", image: "/images/carom-billiards.jpeg" },
    { name: "Nine-Pin Bowling", desc: "Traditional bowling variation with nine pins.", image: "/images/nine-pin-bowling.jpeg" },
    { name: "Disc Golf", desc: "Precision disc throwing sport played on outdoor courses.", image: "/images/disc-golf.jpeg" },
    { name: "Kubb", desc: "Swedish lawn game blending accuracy and strategy.", image: "/images/kubb.jpeg" },
    { name: "Pitch and Putt", desc: "Short-format golf emphasizing approach precision.", image: "/images/pitch-and-putt.jpeg" },
    { name: "Shove Ha’penny", desc: "Tabletop coin precision game requiring fine control.", image: "/images/shove-hapenny.jpeg" },
    { name: "Toad in the Hole", desc: "Pub game testing coin toss accuracy.", image: "/images/toad-in-the-hole.jpeg" },
    { name: "Bat and Trap", desc: "Traditional English target game combining aim and timing.", image: "/images/bat-and-trap.jpeg" },
    { name: "Boccia", desc: "Paralympic precision sport designed for athletes with disabilities.", image: "/images/boccia.jpg" },
    { name: "Gateball", desc: "Malleteam precision sport similar to croquet.", image: "/images/gateball.jpg" },
  ];
        const filteredCategories = categories.filter((item) =>
  item.name.toLowerCase().includes(searchTerm.toLowerCase())
);

  return (
    <div className="font-sans bg-gray-50 text-gray-800 min-h-screen">
      <section className="max-w-7xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate("/categories")}
          className="text-orange-500 text-lg flex items-center gap-2 mb-6 font-medium"
        >
          ← Back to categories
        </button>

       {/* TITLE + SEARCH ROW */}
<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
  <div>
    <h1 className="text-4xl font-extrabold">
     Target & Precision Sports
    </h1>

    <p className="text-gray-600 mt-2">
      Sharpen focus, accuracy, and control through precision-based sports
    </p>
  </div>

  {/* SEARCH INPUT */}
  <div className="relative mt-4 md:mt-0 w-full md:w-64">
    <Search
      size={18}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
    />

    <input
      type="text"
      placeholder="Search disciplines..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                 focus:outline-none focus:ring-0 
                 focus:border-orange-500 
                 transition-all duration-200"
    />
  </div>
</div>

{/* DISCIPLINE COUNT */}
<p className="text-sm text-gray-600 mb-8">
  <span className="text-orange-500 text-lg">•</span>{" "}
  {filteredCategories.length} Disciplines Available
</p>

        {/* UPDATED GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
         {filteredCategories.map((item) => (
            <div
              key={item.name}
              onClick={() => {
                setSelectedSubCategory(item.name);
                setShowChoice(true);
              }}
              className="bg-white rounded-2xl border border-orange-200 overflow-hidden cursor-pointer
                         transition-all duration-300
                         hover:-translate-y-1
                         hover:shadow-[0_10px_30px_rgba(249,115,22,0.35)]"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-48 object-cover"
              />

              <div className="p-5">
                <h3 className="text-orange-600 font-bold text-lg mb-2">
                  {item.name}
                </h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showChoice && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-sm text-center">
            <h3 className="text-xl font-bold mb-4">
              View {selectedSubCategory} as
            </h3>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  navigate(
                    `/viewtrainers?category=Precision Sports&subCategory=${encodeURIComponent(
                      selectedSubCategory,
                    )}`,
                  );
                  setShowChoice(false);
                }}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg"
              >
                Trainers
              </button>

              <button
                onClick={() => {
                  navigate(
                    `/viewinstitutes?category=Precision Sports&subCategory=${encodeURIComponent(
                      selectedSubCategory,
                    )}`,
                  );
                  setShowChoice(false);
                }}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg"
              >
                Institutes
              </button>
            </div>

            <button
              onClick={() => setShowChoice(false)}
              className="mt-4 text-sm text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetPrecisionPage;