import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc } from "firebase/firestore";
export default function ClassTime() {
  const [instituteId, setInstituteId] = useState("");
  const [trainers, setTrainers] = useState([]);
  const [students, setStudents] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [categoriesMap, setCategoriesMap] = useState({});

  const [branches, setBranches] = useState([]);
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
  const [form, setForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    category: "",
    subCategory: "",
    branch: "",
    trainerId: "",
    students: [],
  });
  const isEdit = !!editId;
  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setInstituteId(user.uid);
    });
    return () => unsub();
  }, []);

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    if (!instituteId) return;

    const loadData = async () => {
      try {
        /* ---------------- TRAINERS ---------------- */
        const trainerSnap = await getDocs(
          query(
            collection(db, "InstituteTrainers"),
            where("instituteId", "==", instituteId),
          ),
        );

        setTrainers(trainerSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        /* ---------------- INSTITUTE (CATEGORIES) ---------------- */
        const instituteDoc = await getDoc(doc(db, "institutes", instituteId));

        const instituteData = instituteDoc.data();

        /* ---------------- STUDENTS ---------------- */
        const studentSnap = await getDocs(
          query(
            collection(db, "students"),
            where("instituteId", "==", instituteId),
          ),
        );

        const studentList = studentSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setStudents(studentList);

        /* ---------------- BRANCHES (FIXED) ---------------- */
        const branchSet = new Set();

        studentList.forEach((s) => {
          if (s.branch && s.branch.trim() !== "") {
            branchSet.add(s.branch.trim());
          }
        });

        setBranches([...branchSet]);

        console.log("Students:", studentList);
        console.log("Branches:", [...branchSet]);

        /* ---------------- TIMETABLE ---------------- */
        const timetableSnap = await getDocs(
          collection(db, "institutes", instituteId, "timetable"),
        );

        setSchedule(
          timetableSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })),
        );
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };

    loadData();
  }, [instituteId]);
  const filteredStudents = students.filter((s) => s.branch === form.branch);
  /* ---------------- SAVE ---------------- */
  const saveClass = async () => {
    if (
      !form.category ||
      !form.subCategory ||
      !form.branch ||
      !form.trainerId ||
      form.students.length === 0
    ) {
      alert("Please fill all fields");
      return;
    }

    const trainer = trainers.find((t) => t.id === form.trainerId);

    const startDateTime = new Date(`${form.date}T${form.startTime}`);
    const endDateTime = new Date(`${form.date}T${form.endTime}`);

    const payload = {
      title: form.subCategory,
      category: form.category,
      subCategory: form.subCategory,
      branch: form.branch,
      start: startDateTime,
      end: endDateTime,
      trainerId: trainer.id,
      trainerName: trainer.firstName,
      students: form.students,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editId) {
        // 🔥 UPDATE
        await updateDoc(
          doc(db, "institutes", instituteId, "timetable", editId),
          payload,
        );

        // ✅ update state locally
        setSchedule((prev) =>
          prev.map((item) =>
            item.id === editId ? { ...item, ...payload } : item,
          ),
        );
      } else {
        // 🔥 ADD
        const docRef = await addDoc(
          collection(db, "institutes", instituteId, "timetable"),
          {
            ...payload,
            createdAt: serverTimestamp(),
          },
        );

        // ✅ add to state locally
        setSchedule((prev) => [...prev, { id: docRef.id, ...payload }]);
      }

      // ✅ close modal & reset
      setShowModal(false);
      setEditId(null);
    } catch (err) {
      console.error("Save error:", err);
    }
  };
  useEffect(() => {
    if (form.branch && students.length > 0 && !editId) {
      const autoStudents = students
        .filter((s) => s.branch === form.branch)
        .map((s) => s.id);

      setForm((prev) => ({
        ...prev,
        students: autoStudents,
      }));
    }
  }, [form.branch, students]);
  /* ---------------- FORMAT EVENTS ---------------- */
  const events = schedule.map((s) => ({
    id: s.id,
    title: s.subCategory,
    start: s.start?.toDate ? s.start.toDate() : s.start,
    end: s.end?.toDate ? s.end.toDate() : s.end,
    extendedProps: {
      trainer: s.trainerName,
      count: s.students?.length || 0,
    },
  }));

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg min-h-screen">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridDay,timeGridWeek,dayGridMonth,listYear",
        }}
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        allDaySlot={false}
        eventMinHeight={60}
        height="auto"
        events={events}
        selectable={true}
        select={(info) => {
          const date = info.startStr.split("T")[0];
          const start = info.startStr.split("T")[1]?.slice(0, 5);
          const end = info.endStr.split("T")[1]?.slice(0, 5);

          setEditId(null);

          setForm({
            date,
            startTime: start,
            endTime: end,
            category: "",
            subCategory: "",
            branch: "",
            trainerId: "",
            students: [],
          });

          setShowModal(true);
        }}
        eventClick={(info) => {
          const event = schedule.find((s) => s.id === info.event.id);

          setEditId(event.id);

          setForm({
            date: info.event.startStr.split("T")[0],
            startTime: info.event.startStr.split("T")[1]?.slice(0, 5),
            endTime: info.event.endStr.split("T")[1]?.slice(0, 5),
            category: event.category || "",
            subCategory: event.subCategory || "",
            branch: event.branch || "",
            trainerId: event.trainerId || "",
            students: event.students || [],
          });

          setShowModal(true);
        }}
        eventContent={(info) => {
          return (
            <div className="p-1 text-xs leading-tight">
              <div className="font-semibold text-[13px]">
                {info.event.title}
              </div>

              <div className="text-black-600">
                👤 {info.event.extendedProps.trainer}
              </div>

              <div className="text-black-600 font-medium">
                👥 {info.event.extendedProps.count}
              </div>
            </div>
          );
        }}
      />

      {/* ---------- MODAL ---------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-3">
          <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl w-full max-w-md shadow-xl space-y-4 animate-fadeIn">
            <h3 className="text-xl font-semibold text-center">
              {isEdit ? "✏️ Edit Class" : "📅 Schedule Class"}
            </h3>
            {/* TIME SELECTION */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-500">Start Time</label>
                <input
                  type="time"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-500">End Time</label>
                <input
                  type="time"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({ ...form, endTime: e.target.value })
                  }
                />
              </div>
            </div>
            {/* CATEGORY */}
            <div>
              <label className="text-sm text-gray-500">Category</label>
              <select
                className="w-full border rounded-lg p-2 mt-1"
                value={form.category}
                onChange={(e) => {
                  const selectedCategory = e.target.value;

                  setForm((prev) => ({
                    ...prev,
                    category: selectedCategory,
                    subCategory: "",
                  }));
                }}
              >
                <option value="">Select Category</option>

                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* SUBCATEGORY */}
            <div>
              <label className="text-sm text-gray-500">Sub Category</label>
              <select
                className="w-full border rounded-lg p-2 mt-1"
                value={form.subCategory}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    subCategory: e.target.value,
                  }))
                }
              >
                <option value="">Select SubCategory</option>

                {(subCategoryMap[form.category] || []).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* BRANCH */}
            <div>
              <label className="text-sm text-gray-500">Branch</label>
              <select
                className="w-full border rounded-lg p-2 mt-1"
                value={form.branch}
                onChange={(e) => {
                  const selectedBranch = e.target.value;

                  const autoStudents = students
                    .filter((s) => s.branch === selectedBranch)
                    .map((s) => s.id);

                  setForm({
                    ...form,
                    branch: selectedBranch,
                    students: autoStudents,
                  });
                }}
              >
                <option value="">Select Branch</option>
                {branches.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* STUDENT COUNT */}
            {form.branch && (
              <div className="bg-blue-50 text-blue-700 text-sm p-2 rounded-lg text-center">
                👥 {form.students.length} students will be assigned
                automatically
              </div>
            )}

            {/* TRAINER */}
            <div>
              <label className="text-sm text-gray-500">Trainer</label>
              <select
                className="w-full border rounded-lg p-2 mt-1"
                value={form.trainerId}
                onChange={(e) =>
                  setForm({ ...form, trainerId: e.target.value })
                }
              >
                <option value="">Select Trainer</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName}
                  </option>
                ))}
              </select>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={saveClass}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
              >
                {editId ? "Update" : "Save"}
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
