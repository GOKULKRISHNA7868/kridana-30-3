import React from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

const Dance = () => {
  const navigate = useNavigate();
  const [selectedSubCategory, setSelectedSubCategory] = React.useState(null);
  const [showChoice, setShowChoice] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const categories = [
    { name: "Bharatanatyam", desc: "Classical South Indian dance known for grace and expressions.", image: "/images/bharatanatyam.jpeg" },
    { name: "Kathak", desc: "North Indian classical dance with rhythmic footwork.", image: "/images/kathak.jpeg" },
    { name: "Kathakali", desc: "Traditional Kerala dance-drama with elaborate costumes.", image: "/images/kathakali.jpeg" },
    { name: "Kuchipudi", desc: "Expressive classical dance from Andhra Pradesh.", image: "/images/kuchipudi.jpeg" },
    { name: "Odissi", desc: "Ancient classical dance from Odisha.", image: "/images/odissi.jpeg" },
    { name: "Mohiniyattam", desc: "Graceful classical dance form from Kerala.", image: "/images/mohiniyattam.jpeg" },
    { name: "Manipuri", desc: "Spiritual classical dance from Manipur.", image: "/images/manipuri.jpeg" },
    { name: "Sattriya", desc: "Assamese classical dance rooted in Vaishnav traditions.", image: "/images/sattriya.jpeg" },
    { name: "Chhau", desc: "Masked tribal dance blending martial arts.", image: "/images/chhau.jpeg" },
    { name: "Yakshagana", desc: "Dance-drama form from Karnataka.", image: "/images/yakshagana.jpeg" },
    { name: "Lavani", desc: "Energetic folk dance from Maharashtra.", image: "/images/lavani.jpeg" },
    { name: "Ghoomar", desc: "Traditional Rajasthani folk dance.", image: "/images/ghoomar.jpeg" },
    { name: "Kalbelia", desc: "Snake-inspired folk dance of Rajasthan.", image: "/images/kalbelia.jpeg" },
    { name: "Garba", desc: "Gujarati folk dance performed during Navratri.", image: "/images/garba.jpeg" },
    { name: "Dandiya Raas", desc: "Stick dance form from Gujarat.", image: "/images/dandiya-raas.jpeg" },
    { name: "Bhangra", desc: "Vibrant Punjabi harvest dance.", image: "/images/bhangra.jpeg" },
    { name: "Bihu", desc: "Folk dance from Assam celebrating harvest.", image: "/images/bihu.jpeg" },
    { name: "Dollu Kunitha", desc: "Drum-based dance from Karnataka.", image: "/images/dollu-kunitha.jpeg" },
    { name: "Theyyam", desc: "Ritualistic performance dance from Kerala.", image: "/images/theyyam.jpeg" },
    { name: "Ballet", desc: "Graceful Western classical dance form.", image: "/images/ballet.jpeg" },
    { name: "Contemporary", desc: "Expressive modern dance style.", image: "/images/contemporary.jpeg" },
    { name: "Hip Hop", desc: "Street dance style with energetic moves.", image: "/images/hip-hop.jpeg" },
    { name: "Breakdance", desc: "Acrobatic street dance form.", image: "/images/breakdance.jpeg" },
    { name: "Jazz Dance", desc: "Dynamic and stylish Western dance form.", image: "/images/jazz-dance.jpeg" },
    { name: "Tap Dance", desc: "Dance form using rhythmic foot tapping.", image: "/images/tap-dance.jpeg" },
    { name: "Modern Dance", desc: "Freeform expressive dance style.", image: "/images/modern-dance.jpeg" },
    { name: "Street Dance", desc: "Urban freestyle dance culture.", image: "/images/street-dance.jpeg" },
    { name: "House Dance", desc: "Club-style dance with footwork focus.", image: "/images/house-dance.jpeg" },
    { name: "Locking", desc: "Funky dance style with quick pauses.", image: "/images/locking.jpeg" },
    { name: "Popping", desc: "Robotic style street dance technique.", image: "/images/popping.jpeg" },
    { name: "Krumping", desc: "High-energy expressive street dance.", image: "/images/krumping.jpeg" },
    { name: "Waacking", desc: "Expressive arm-focused dance style.", image: "/images/waacking.jpeg" },
    { name: "Voguing", desc: "Stylized pose-based dance form.", image: "/images/voguing.jpeg" },
    { name: "Salsa", desc: "Popular Latin partner dance.", image: "/images/salsa.jpeg" },
    { name: "Bachata", desc: "Romantic Latin dance style.", image: "/images/bachata.jpeg" },
    { name: "Merengue", desc: "Energetic Dominican partner dance.", image: "/images/merengue.jpeg" },
    { name: "Cha-Cha", desc: "Lively ballroom Latin dance.", image: "/images/cha-cha.jpeg" },
    { name: "Rumba", desc: "Slow expressive Cuban dance.", image: "/images/rumba.jpeg" },
    { name: "Samba", desc: "Brazilian carnival dance style.", image: "/images/samba.jpeg" },
    { name: "Paso Doble", desc: "Dramatic Spanish-style ballroom dance.", image: "/images/paso-doble.jpeg" },
    { name: "Jive", desc: "Fast and lively swing dance.", image: "/images/jive.jpeg" },
    { name: "Tango", desc: "Passionate partner dance from Argentina.", image: "/images/tango.jpeg" },
    { name: "Waltz", desc: "Elegant ballroom dance in triple time.", image: "/images/waltz.jpeg" },
    { name: "Foxtrot", desc: "Smooth progressive ballroom dance.", image: "/images/foxtrot.jpeg" },
    { name: "Quickstep", desc: "Fast and light ballroom dance.", image: "/images/quickstep.jpeg" },
    { name: "Flamenco", desc: "Expressive Spanish dance with guitar.", image: "/images/flamenco.jpeg" },
    { name: "Irish Stepdance", desc: "Traditional Irish rhythmic dance.", image: "/images/irish-stepdance.jpeg" },
    { name: "Scottish Highland Dance", desc: "Traditional Scottish dance form.", image: "/images/scottish-highland-dance.jpeg" },
    { name: "Morris Dance", desc: "English traditional folk dance.", image: "/images/morris-dance.jpeg" },
    { name: "Hula", desc: "Traditional Hawaiian storytelling dance.", image: "/images/hula.jpeg" },
    { name: "Maori Haka", desc: "Traditional war dance of New Zealand.", image: "/images/maori-haka.jpeg" },
    { name: "African Tribal Dance", desc: "Rhythmic traditional African dance.", image: "/images/african-tribal-dance.jpeg" },
    { name: "Zumba", desc: "Dance fitness workout program.", image: "/images/zumba.jpeg" },
    { name: "K-Pop Dance", desc: "Choreography inspired by Korean pop.", image: "/images/kpop-dance.jpeg" },
    { name: "Shuffle Dance", desc: "Fast footwork electronic dance style.", image: "/images/shuffle-dance.jpeg" },
    { name: "Electro Dance", desc: "Club-based electronic music dance.", image: "/images/electro-dance.jpeg" },
    { name: "Pole Dance", desc: "Acrobatic and strength-based dance form.", image: "/images/pole-dance.jpeg" },
    { name: "Ballroom Dance", desc: "Partner dance styles performed socially.", image: "/images/ballroom-dance.jpeg" },
    { name: "Line Dance", desc: "Group dance performed in lines.", image: "/images/line-dance.jpeg" },
    { name: "Square Dance", desc: "Traditional American partner dance.", image: "/images/square-dance.jpeg" },
    { name: "Folk Dance", desc: "Traditional cultural group dances.", image: "/images/folk-dance.jpeg" },
    { name: "Contra Dance", desc: "Social folk dance with live music.", image: "/images/contra-dance.jpeg" },
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
    <h1 className="text-4xl font-extrabold">Dance</h1>
    <p className="text-gray-600 mt-2">
      Discover classical, folk, modern, street and international dance styles
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
                <p className="text-gray-600 text-sm">
                  {item.desc}
                </p>
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
                  navigate(`/viewtrainers?category=Dance&subCategory=${encodeURIComponent(selectedSubCategory)}`);
                  setShowChoice(false);
                }}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg"
              >
                Trainers
              </button>

              <button
                onClick={() => {
                  navigate(`/viewinstitutes?category=Dance&subCategory=${encodeURIComponent(selectedSubCategory)}`);
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

export default Dance;