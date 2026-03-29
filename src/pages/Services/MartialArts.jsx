import React from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

const MartialArtsPage = () => {
  const navigate = useNavigate();
  const [selectedSubCategory, setSelectedSubCategory] = React.useState(null);
  const [showChoice, setShowChoice] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");

  const categories = [
    { name: "Karate", desc: "Traditional Japanese striking martial art.", image: "/images/karate.jpeg" },
    { name: "Kung Fu", desc: "Ancient Chinese martial art emphasizing fluid movements.", image: "/images/kung-fu.jpeg" },
    { name: "Krav Maga", desc: "Israeli self-defense system focused on real-world scenarios.", image: "/images/krav-maga.jpeg" },
    { name: "Muay Thai", desc: "Thai martial art known as the art of eight limbs.", image: "/images/muay-thai.jpeg" },
    { name: "Taekwondo", desc: "Korean martial art known for powerful kicks.", image: "/images/taekwondo.jpeg" },
    { name: "Judo", desc: "Japanese grappling art focusing on throws and submissions.", image: "/images/judo.jpeg" },
    { name: "Brazilian Jiu-Jitsu", desc: "Ground fighting martial art focused on submissions.", image: "/images/brazilian-jiu-jitsu.jpeg" },
    { name: "Aikido", desc: "Japanese defensive martial art using opponent's energy.", image: "/images/aikido.jpeg" },
    { name: "Jeet Kune Do", desc: "Philosophy-based martial art developed by Bruce Lee.", image: "/images/jeet-kune-do.jpeg" },
    { name: "Capoeira", desc: "Brazilian martial art combining dance and acrobatics.", image: "/images/capoeira.jpeg" },
    { name: "Sambo", desc: "Russian martial art blending wrestling and submissions.", image: "/images/sambo.jpeg" },
    { name: "Silat", desc: "Southeast Asian martial art focusing on joint manipulation.", image: "/images/silat.jpeg" },
    { name: "Kalaripayattu", desc: "Ancient Indian martial art emphasizing agility and weapons.", image: "/images/kalaripayattu.jpeg" },
    { name: "Hapkido", desc: "Korean martial art using strikes and joint locks.", image: "/images/hapkido.jpeg" },
    { name: "Wing Chun", desc: "Chinese close-combat martial art focused on quick strikes.", image: "/images/wing-chun.jpeg" },
    { name: "Shaolin", desc: "Chinese martial art combining meditation and combat.", image: "/images/shaolin.jpeg" },
    { name: "Ninjutsu", desc: "Japanese martial art focused on stealth and strategy.", image: "/images/ninjutsu.jpeg" },
    { name: "Kickboxing", desc: "Combat sport combining punches and kicks.", image: "/images/kickboxing.jpeg" },
    { name: "Boxing", desc: "Western combat sport focused on punches and footwork.", image: "/images/boxing.jpeg" },
    { name: "Wrestling", desc: "Grappling sport focused on takedowns and control.", image: "/images/wrestling.jpeg" },

    { name: "Shorinji Kempo", desc: "Japanese martial art blending self-defense and philosophy.", image: "/images/shorinji-kempo.jpeg" },
    { name: "Kyokushin", desc: "Full-contact style of karate known for toughness.", image: "/images/kyokushin.jpeg" },
    { name: "Goju-ryu", desc: "Karate style combining hard and soft techniques.", image: "/images/goju-ryu.jpeg" },
    { name: "Shotokan", desc: "Traditional karate style emphasizing powerful linear strikes.", image: "/images/shotokan.jpeg" },
    { name: "Wushu", desc: "Modern Chinese martial art focused on performance and combat.", image: "/images/wushu.jpeg" },
    { name: "Savate", desc: "French kickboxing martial art using precise kicks.", image: "/images/savate.jpeg" },
    { name: "Lethwei", desc: "Burmese bare-knuckle boxing with head strikes.", image: "/images/lethwei.jpeg" },
    { name: "Bajiquan", desc: "Chinese martial art known for explosive power.", image: "/images/bajiquan.jpeg" },
    { name: "Hung Gar", desc: "Southern Chinese martial art with strong stances.", image: "/images/hung-gar.jpeg" },
    { name: "Praying Mantis Kung Fu", desc: "Chinese martial art inspired by mantis movements.", image: "/images/praying-mantis-kung-fu.jpeg" },
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
    <h1 className="text-4xl font-extrabold">Martial Arts</h1>
    <p className="text-gray-600 mt-2">
      Explore powerful martial arts disciplines from around the world
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
                    `/viewtrainers?category=Martial Arts&subCategory=${encodeURIComponent(
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
                    `/viewinstitutes?category=Martial Arts&subCategory=${encodeURIComponent(
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

export default MartialArtsPage;