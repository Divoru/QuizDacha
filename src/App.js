import React from "react";

export default function DigitalDachaApp() {
  const [started, setStarted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [profile, setProfile] = React.useState(null);

  if (loading) return <LoadingScreen />;
  if (profile) return <ResultScreen profile={profile} />;

  if (started) {
    return (
      <Quiz
        onFinish={(answers) => {
          setLoading(true);
        
          const calculatedProfile = calculateProfile(answers);
        
          fetch(
            "https://script.google.com/macros/s/AKfycbwAVOPk1Iz6Cnx90NSfeFlhnY9EgLJZzuUFInSnI7pADi7PqR6Lg5_DVk-HnoablJv9/exec",
            {
              method: "POST",
              mode: "no-cors",
              headers: {
                "Content-Type": "text/plain;charset=utf-8"
              },
              body: JSON.stringify({
                answers: answers,
                result: calculatedProfile.type,
                profile: calculatedProfile,
                comment: "quiz"
              }),
              keepalive: true
            }
          ).catch((err) =>
            console.error("Ошибка отправки в Google Sheets:", err)
          );
        
          setTimeout(() => {
            setProfile(calculatedProfile);
            setLoading(false);
          }, 4000);
        }}
      />
    );
  }

  return <IntroScreen onStart={() => setStarted(true)} />;
}

function IntroScreen({ onStart }) {
  return (
    <div className="h-screen bg-black text-white flex items-center justify-center px-5">
      <div className="max-w-md text-center">
        <h1 className="text-2xl mb-6">Цифровой помощник для вашей дачи</h1>

        <p className="text-white/70 mb-6">
          Он поможет сделать дачу удобнее именно для Вас, подскажет, что
          улучшить и избавит от лишних забот.
        </p>

        <p className="text-white/50 mb-8 text-sm">
          Пройдите короткий тест — и он “поймёт” вашу дачу
        </p>

        <button
          onClick={onStart}
          className="w-full bg-green-400 text-black p-4 rounded-xl font-semibold"
        >
          Начать
        </button>
      </div>
    </div>
  );
}

function Quiz({ onFinish }) {
  const questions = [
    {
      question: "Для вас дача — это:",
      answers: [
        "Отдых и расслабление",
        "Место для дел и забот",
        "Что-то между",
      ],
    },
    {
      question: "Что для вас важнее всего на даче?",
      answers: [
        "Отдых, друзья, баня",
        "Огород и урожай",
        "Красивый участок",
        "Чтобы всё просто работало",
      ],
    },
    {
      question: "Как вы обычно используете дачу?",
      answers: [
        "Живу или бываю часто",
        "Приезжаю на выходные",
        "Редко бываю",
        "Почти не бываю",
      ],
    },
    {
      question: "Когда вы на даче, что чаще всего происходит?",
      answers: [
        "Постоянно что-то нужно делать",
        "Иногда отвлекают бытовые задачи",
        "В основном отдыхаю",
        "По-разному",
      ],
    },
    {
      question: "Как вы сейчас решаете вопросы по даче?",
      answers: [
        "Сам",
        "Через знакомых",
        "Каждый раз ищу заново",
        "Стараюсь не заниматься",
      ],
    },
    {
      question: "Если можно было бы упростить дачу, что было бы самым ценным?",
      answers: [
        "Чтобы всё работало без моего участия",
        "Чтобы не искать мастеров",
        "Чтобы участок был красивым",
        "Чтобы было больше времени на отдых",
      ],
    },
    {
      question: "Хотели бы вы, чтобы дача сама подсказывала что делать?",
      answers: ["Да, это идеально", "Скорее да", "Не уверен", "Нет"],
    },
  ];

  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState([]);

  const next = (answer) => {
    const updated = [...answers, answer];
    setAnswers(updated);

    if (step + 1 < questions.length) {
      setStep(step + 1);
    } else {
      onFinish(updated);
    }
  };

  return (
    <div className="h-screen bg-black text-white flex items-center justify-center px-5">
      <div className="max-w-md w-full">
        <h2 className="text-xl mb-6">{questions[step].question}</h2>

        <div className="flex flex-col gap-3">
          {questions[step].answers.map((a, i) => (
            <button
              key={i}
              onClick={() => next(a)}
              className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-left"
            >
              {a}
            </button>
          ))}
        </div>

        <div className="mt-4 text-sm text-white/40">
          {step + 1} / {questions.length}
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen bg-black text-white flex items-center justify-center px-5 text-center">
      <div>
        <h1 className="mb-6 text-xl">Настраиваем вашего помощника...</h1>

        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-green-400 animate-pulse w-full"></div>
        </div>

        <p className="text-sm text-white/50">Анализируем вашу дачу</p>
      </div>
    </div>
  );
}

function calculateProfile(answers) {
  const [
    dachaRole, // Для вас дача — это
    priority, // Что важнее всего
    usage, // Как используете дачу
    dayReality, // Что чаще всего происходит
    problemSolving, // Как решаете вопросы
    mainValue, // Что было бы самым ценным
    assistantReadiness, // Хотели бы помощника
  ] = answers;

  let type = "control";

  if (priority === "Отдых, друзья, баня") type = "relax";
  else if (priority === "Огород и урожай") type = "garden";
  else if (priority === "Красивый участок") type = "beauty";
  else type = "control";

  let load = "medium";
  if (dayReality === "Постоянно что-то нужно делать") load = "high";
  else if (dayReality === "Иногда отвлекают бытовые задачи") load = "medium";
  else if (dayReality === "В основном отдыхаю") load = "low";

  let usageType = "medium";
  if (usage === "Живу или бываю часто") usageType = "high";
  else if (usage === "Приезжаю на выходные") usageType = "medium";
  else if (usage === "Редко бываю" || usage === "Почти не бываю")
    usageType = "low";

  let organization = "self";
  if (problemSolving === "Сам") organization = "self";
  else if (problemSolving === "Через знакомых") organization = "network";
  else if (problemSolving === "Каждый раз ищу заново") organization = "chaos";
  else if (problemSolving === "Стараюсь не заниматься") organization = "avoid";

  let readiness = "medium";
  if (assistantReadiness === "Да, это идеально") readiness = "high";
  else if (assistantReadiness === "Скорее да") readiness = "medium";
  else if (assistantReadiness === "Не уверен") readiness = "low";
  else readiness = "no";

  let trigger = "comfort";
  if (mainValue === "Чтобы всё работало без моего участия")
    trigger = "automation";
  else if (mainValue === "Чтобы не искать мастеров") trigger = "execution";
  else if (mainValue === "Чтобы участок был красивым") trigger = "beauty";
  else if (mainValue === "Чтобы было больше времени на отдых") trigger = "time";

  return {
    type,
    load,
    usageType,
    organization,
    readiness,
    trigger,
    raw: {
      dachaRole,
      priority,
      usage,
      dayReality,
      problemSolving,
      mainValue,
      assistantReadiness,
    },
  };
}

function ResultScreen({ profile }) {
  const [submitted, setSubmitted] = React.useState(false);

  const typeContent = {
    relax: {
      title: "Вы хотите отдыхать, а не заниматься дачей 🌿",
      intro:
        "Для вас дача — это место, где хочется расслабиться, провести время с близкими и отключиться от забот.",
      pain: "Но на практике часть бытовых задач всё равно забирает внимание. Не критично — но именно это мешает получать от дачи максимум удовольствия.",
      bridge:
        "Это можно убрать практически полностью — без вашего постоянного участия.",
    },

    garden: {
      title: "Вы используете дачу с пользой 🥕",
      intro:
        "Для вас важно, чтобы дача давала результат: урожай, порядок, ощущение, что всё под контролем.",
      pain: "Но часть процессов сейчас, скорее всего, не оптимизирована и требует лишнего времени и усилий.",
      bridge: "Это можно упростить и сделать более предсказуемым.",
    },

    beauty: {
      title: "Вы хотите красивую и ухоженную дачу 🌸",
      intro:
        "Для вас важно, чтобы участок выглядел аккуратно, гармонично и радовал глаз.",
      pain: "Но поддержание этого состояния требует постоянного внимания и решений.",
      bridge: "Это можно систематизировать и упростить.",
    },

    control: {
      title: "Вам важно, чтобы всё работало без проблем 🏡",
      intro:
        "Вы хотите, чтобы дача была понятной, управляемой и не создавала лишних задач.",
      pain: "Но сейчас часть вопросов возникает неожиданно и требует времени на решение.",
      bridge: "Это можно сделать более контролируемым и предсказуемым.",
    },
  };

  const loadText = {
    high: "Сейчас дача, скорее всего, требует от вас слишком много внимания и регулярно забирает силы.",
    medium:
      "Сейчас часть вопросов уже отвлекает вас от комфорта, хотя это еще можно легко упорядочить.",
    low: "У вас уже есть хорошая база для комфортной дачи, и её можно сделать еще удобнее.",
  };

  const orgText = {
    self: "Вы привыкли многое держать под личным контролем.",
    network: "Вы чаще решаете вопросы через знакомых и проверенные контакты.",
    chaos: "Сейчас многие вопросы, вероятно, решаются каждый раз заново.",
    avoid: "Похоже, вам не хочется тратить время на организацию дачных задач.",
  };

  const triggerCards = {
    automation: "✔️ Автоматические подсказки: что важно сделать и когда",
    execution: "✔️ Помощь без лишних поисков и повторных объяснений",
    beauty: "✔️ Идеи и приоритеты для красивой и ухоженной дачи",
    time: "✔️ Больше свободного времени вместо постоянных мелких задач",
  };

  const readinessText = {
    high: "Вы уже готовы к формату цифрового помощника.",
    medium:
      "Такой формат вам, скорее всего, подойдет, если он будет простым и полезным.",
    low: "Важно, чтобы помощник был максимально понятным и не требовал лишних действий.",
    no: "Вам, скорее всего, нужен не “сервис ради сервиса”, а действительно практичная польза.",
  };

  const data = typeContent[profile.type];

  return (
    <div className="h-screen bg-black text-white flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <div className="text-green-300 text-sm mb-3">
            Цифровой профиль вашей дачи готов
          </div>

          <h1 className="text-2xl mb-4">{data.title}</h1>

          <p className="mb-3 text-white/80">{data.intro}</p>

          <p className="mb-3 text-white/60">{data.pain}</p>

          <p className="mb-6 text-green-300 font-medium">{data.bridge}</p>

          <div className="space-y-3 mb-6">
            <div className="bg-white/10 p-3 rounded-xl">
              ✔️ Вы заранее понимаете, что важно для вашей дачи
            </div>

            <div className="bg-white/10 p-3 rounded-xl">
              ✔️ Не нужно искать решения и разбираться каждый раз заново
            </div>

            <div className="bg-white/10 p-3 rounded-xl">
              ✔️ Дача перестаёт отвлекать и начинает работать “сама”
            </div>
          </div>

          <p className="mb-6 text-white/65">
            {readinessText[profile.readiness]} Цифровой помощник сможет
            подсказывать, что важно именно для вашей дачи, помогать не
            распыляться и делать жизнь за городом заметно удобнее.
          </p>

          <p className="mb-6 text-white/70 text-sm">
            Это не “ещё один сервис”. Это система, которая берёт на себя часть
            решений и делает вашу дачу проще и удобнее.
          </p>

          <button
            onClick={() => setSubmitted(true)}
            className="w-full bg-green-400 text-black p-4 rounded-xl font-semibold"
          >
            Подключить помощника
          </button>
        </div>
      </div>

      {submitted && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-5 z-50">
          <div className="bg-white text-black rounded-3xl p-6 max-w-sm w-full text-center">
            <h2 className="text-xl font-semibold mb-4">Заявка принята ✅</h2>

            <p className="text-sm mb-6">
              В ближайшее время с вами свяжется наш администратор и расскажет,
              как будет работать цифровой помощник для вашей дачи.
            </p>

            <button
              onClick={() => setSubmitted(false)}
              className="w-full bg-black text-white p-3 rounded-xl"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
