import React from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

const Adventure = () => {
  const navigate = useNavigate();
  const [selectedSubCategory, setSelectedSubCategory] = React.useState(null);
  const [showChoice, setShowChoice] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const categories = [
    { name: "Rock Climbing", desc: "Scale natural and artificial rock formations.", image: "/images/rock-climbing.jpeg" },
    { name: "Mountaineering", desc: "High-altitude climbing and mountain expeditions.", image: "/images/mountaineering.jpeg" },
    { name: "Trekking", desc: "Explore scenic long-distance trails.", image: "/images/trekking.jpeg" },
    { name: "Hiking", desc: "Enjoy nature through day or multi-day hikes.", image: "/images/hiking.jpeg" },
    { name: "Mountain Biking", desc: "Ride rugged off-road trails.", image: "/images/mountain-biking.jpeg" },
    { name: "Sandboarding", desc: "Glide down sand dunes at high speed.", image: "/images/sandboarding.jpeg" },
    { name: "Orienteering", desc: "Navigation sport using maps and compass.", image: "/images/orienteering.jpeg" },
    { name: "Obstacle Course Racing", desc: "Test endurance through physical challenges.", image: "/images/obstacle-course-racing.jpeg" },
    { name: "Skydiving", desc: "Freefall from aircraft at high altitude.", image: "/images/skydiving.jpeg" },
    { name: "Paragliding", desc: "Soar across skies with a parachute wing.", image: "/images/paragliding.jpeg" },
    { name: "Hang Gliding", desc: "Glide using a lightweight frame aircraft.", image: "/images/hang-gliding.jpeg" },
    { name: "Parachuting", desc: "Controlled descent from heights.", image: "/images/parachuting.jpeg" },
    { name: "Hot-air Ballooning", desc: "Peaceful aerial experience in a balloon.", image: "/images/hot-air-ballooning.jpeg" },
    { name: "Skiing", desc: "Glide across snowy slopes.", image: "/images/skiing.jpeg" },
    { name: "Snowboarding", desc: "Snow sport using a single board.", image: "/images/snowboarding.jpeg" },
    { name: "Ice Climbing", desc: "Climb frozen waterfalls and ice walls.", image: "/images/ice-climbing.jpeg" },
    { name: "Heli-skiing", desc: "Access remote slopes via helicopter.", image: "/images/heli-skiing.jpeg" },
    { name: "Bungee Jumping", desc: "Jump from heights with elastic cord.", image: "/images/bungee-jumping.jpeg" },
    { name: "BASE Jumping", desc: "Parachute from fixed objects.", image: "/images/base-jumping.jpeg" },
    { name: "Canyoning", desc: "Navigate through canyon terrains.", image: "/images/canyoning.jpeg" },
    { name: "Kite Buggy", desc: "Ride land buggy powered by kite.", image: "/images/kite-buggy.jpeg" },
    { name: "Zorbing", desc: "Roll downhill inside a giant ball.", image: "/images/zorbing.jpeg" },
    { name: "Zip Lining", desc: "Glide across cables over landscapes.", image: "/images/zip-lining.jpeg" },
  ];
  const filteredCategories = categories.filter((item) =>
  item.name.toLowerCase().includes(searchTerm.toLowerCase())
);

  return (
    <div className="font-sans bg-gray-50 text-gray-800">
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
    <h1 className="text-4xl font-extrabold">Adventure Sports</h1>
    <p className="text-gray-600 mt-2">
      Explore thrilling adventure and outdoor sports experiences
    </p>
  </div>

  {/* SEARCH INPUT */}
  <div className="relative mt-4 md:mt-0 w-64">
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
                 focus:outline-none focus:border-orange-500 
                 transition-all duration-200"
    />
  </div>
</div>

{/* DISCIPLINE COUNT */}
<p className="text-sm text-gray-600 mb-8">
  <span className="text-purple-600 text-lg">•</span>{" "}
  {filteredCategories.length} Disciplines Available
</p>
        {/* RESPONSIVE GRID */}
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
                    `/viewtrainers?category=Adventure & Outdoor Sports&subCategory=${encodeURIComponent(
                      selectedSubCategory
                    )}`
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
                    `/viewinstitutes?category=Adventure & Outdoor Sports&subCategory=${encodeURIComponent(
                      selectedSubCategory
                    )}`
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

export default Adventure;