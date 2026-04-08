import React from "react";

const WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbwAVOPk1Iz6Cnx90NSfeFlhnY9EgLJZzuUFInSnI7pADi7PqR6Lg5_DVk-HnoablJv9/exec";

const QUIZ_VERSION = "v3_lifestyle";

// NEW
function generateId() {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10)
  );
}

// NEW
function getUserId() {
  const key = "dd_user_id";
  let userId = localStorage.getItem(key);

  if (!userId) {
    userId = generateId();
    localStorage.setItem(key, userId);
  }

  return userId;
}

function getTrackingParams() {
  const params = new URLSearchParams(window.location.search);

  return {
    source: params.get("utm_source") || params.get("source") || params.get("src") || "",
    variant: params.get("utm_campaign") || params.get("variant") || params.get("v") || "",
    segment: params.get("utm_content") || params.get("segment") || params.get("seg") || "",
    medium: params.get("utm_medium") || "",
    campaign: params.get("utm_campaign") || "",
  };
}

function sendEvent(payload) {
  try {
    fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
        quiz_version: QUIZ_VERSION,
        ...payload,
      }),
      keepalive: true,
    }).catch((err) => console.error("Ошибка отправки:", err));
  } catch (err) {
    console.error("Ошибка sendEvent:", err);
  }
}

export default function DigitalDachaApp() {
  // NEW
  const userId = React.useMemo(() => getUserId(), []);
  const tracking = React.useMemo(() => getTrackingParams(), []);

  // NEW
  const [sessionId, setSessionId] = React.useState(null);

  const [started, setStarted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [profile, setProfile] = React.useState(null);
  const [submission, setSubmission] = React.useState(null);

  const handleStart = () => {
    // NEW
    const newSessionId = generateId();
    setSessionId(newSessionId);

    setStarted(true);
    setLoading(false);
    setProfile(null);
    setSubmission(null);

    sendEvent({
      event_type: "quiz_started",
      user_id: userId, // NEW
      session_id: newSessionId,
      source: tracking.source,
      variant: tracking.variant,
      segment: tracking.segment,
      medium: tracking.medium,
      campaign: tracking.campaign,
      step_index: 0,
      step_count: 0,
      completed: false,
      cta_clicked: false,
    });
  };

  if (loading) return <LoadingScreen />;
  if (profile) {
    return (
      <ResultScreen
        profile={profile}
        submission={submission}
        userId={userId} // NEW
        sessionId={sessionId}
        tracking={tracking}
      />
    );
  }

  if (started) {
    return (
      <Quiz
        userId={userId} // NEW
        sessionId={sessionId}
        tracking={tracking}
        onFinish={({ answers, idealDacha, totalSteps }) => {
          setLoading(true);

          const calculatedProfile = calculateProfile(answers, idealDacha);

          const submissionPayload = {
            event_type: "quiz_completed",
            user_id: userId, // NEW
            session_id: sessionId,
            source: tracking.source,
            variant: tracking.variant,
            segment: tracking.segment,
            medium: tracking.medium,
            campaign: tracking.campaign,
            step_index: totalSteps,
            step_count: totalSteps,
            completed: true,
            cta_clicked: false,
            answers: answers,
            ideal_dacha: idealDacha || "",
            profile: calculatedProfile,
            profile_type: calculatedProfile.type,
          };

          sendEvent(submissionPayload);
          setSubmission(submissionPayload);

          setTimeout(() => {
            setProfile(calculatedProfile);
            setLoading(false);
          }, 2500);
        }}
      />
    );
  }

  return <IntroScreen onStart={handleStart} />;
}

function IntroScreen({ onStart }) {
  return (
    <div className="h-screen bg-black text-white flex items-center justify-center px-5">
      <div className="max-w-md text-center">
        <div className="text-green-300 text-sm mb-3">Единое окно</div>

        <h1 className="text-2xl mb-6">Цифровой помощник для вашей дачи</h1>

        <p className="text-white/80 mb-4">
          Он поможет сделать дачу удобнее именно для Вас:
          подскажет, что важно, напомнит о нужном и избавит от лишних забот.
        </p>

        <p className="text-white/55 mb-8 text-sm">
          Пройдите короткий тест — и помощник лучше поймёт Вашу дачу и Ваш образ жизни.
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

function Quiz({ onFinish, userId, sessionId, tracking }) {
  const questions = [
    {
      type: "single",
      question: "Когда вы приезжаете на дачу, о чем вы думаете первым делом?",
      answers: [
        "Наконец-то отдых, хочу расслабиться",
        "Надо проверить участок и всё привести в порядок",
        "Опять куча дел, вряд ли получится нормально отдохнуть",
        "Нравится заниматься участком, это в удовольствие",
      ],
    },
    {
      type: "single",
      question: "Для вас дача в первую очередь это?",
      answers: [
        "Отдых и тишина",
        "Свои овощи и зелень к столу",
        "Ухоженный участок, которым приятно любоваться",
        "Чтобы всё было под контролем и ни о чем не беспокоиться",
      ],
    },
    {
      type: "single",
      question: "Как вы обычно используете дачу?",
      answers: [
        "Живу здесь постоянно",
        "Бываю почти каждые выходные",
        "Приезжаю время от времени",
        "Бываю редко, но за участком кто-то следит",
        "Почти не бываю, и за участком никто не следит",
      ],
    },
    {
      type: "single",
      question: "После выходных, проведенных на даче, вы обычно:",
      answers: [
        "Чувствую себя скорее уставшим, чем отдохнувшим",
        "Немножко устал, но доволен",
        "Отдохнул и набрался сил",
        "По-разному бывает",
      ],
    },
    {
      type: "single",
      question: "Когда на даче нужно что-то сделать или улучшить, вы обычно:",
      answers: [
        "Всегда самому интересно этим заняться",
        "Звоню знакомым мастерам",
        "Ищу, кто бы мог это сделать",
        "Всегда откладываю, пока не станет срочно",
      ],
    },
    {
      type: "single",
      question:
        "Если бы дача занимала на 90% меньше ваших сил, чем бы вы заняли освободившееся время?",
      answers: [
        "Чаще звал бы друзей на шашлыки",
        "Просто лежал бы в гамаке с книгой или любовался природой",
        "Занялся бы тем, что мне нравится: сажать редкие цветы, поливать газон…",
        "Ездил бы туда намного реже (чем тогда там еще заниматься?)",
      ],
    },
    {
      type: "single",
      question:
        'Представьте, что у вас есть идеальный личный помощник по даче, который всё умеет и всегда всё помнит. Как бы вы предпочли получать от него вести?',
      answers: [
        'Он просто молча все делает, а мне присылает отчет: "Готово, хозяин"',
        'Он пишет: "Я заметил мох на крыше, и уже подобрал трех мастеров, кого позвать?"',
        'Он советует: "Через месяц пора стричь туи, записать в календарь?"',
        "Спасибо, но я лучше сам решу, когда и что мне делать",
      ],
    },
    {
      type: "single",
      question: "Какая роль в жизни дачи подошла вам больше всего?",
      answers: [
        "Режиссер: Принимаю ключевые решения, но не занимаюсь рутиной и бытовухой",
        "Партнер: Делаю все интересное сам, скучное пускай делает помощник",
        "Владелец: Хочу получать результат без лишнего моего участия",
        "Сторож: Мне спокойнее, если я сам все буду контролировать",
      ],
    },
    {
      type: "text_optional",
      question:
        "Какая она — ваша идеальная дача? Можно ответить коротко, в 2–3 словах.",
      placeholder: "Например: тихая, ухоженная, беззаботная",
      helper:
        "Если не затруднить, напишите ваш ответ — это поможет точнее понять Вашу дачу",
    },
  ];

  const closedQuestionsCount = 8;
  const totalSteps = questions.length;

  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState([]);
  const [idealDacha, setIdealDacha] = React.useState("");

  const current = questions[step];

  const trackStep = ({ answerText = "", currentStepIndex }) => {
    sendEvent({
      event_type: "quiz_step",
      user_id: userId, // NEW
      session_id: sessionId,
      source: tracking.source,
      variant: tracking.variant,
      segment: tracking.segment,
      medium: tracking.medium,
      campaign: tracking.campaign,
      step_index: currentStepIndex + 1,
      step_count: currentStepIndex + 1,
      completed: false,
      cta_clicked: false,
      question: questions[currentStepIndex].question,
      answer: answerText,
    });
  };

  const nextSingle = (answer) => {
    const updated = [...answers, answer];
    setAnswers(updated);

    trackStep({
      answerText: answer,
      currentStepIndex: step,
    });

    if (step + 1 < questions.length) {
      setStep(step + 1);
    } else {
      onFinish({
        answers: updated,
        idealDacha,
        totalSteps,
      });
    }
  };

  const finishTextStep = () => {
    trackStep({
      answerText: idealDacha || "",
      currentStepIndex: step,
    });

    onFinish({
      answers,
      idealDacha,
      totalSteps,
    });
  };

  const skipTextStep = () => {
    trackStep({
      answerText: "",
      currentStepIndex: step,
    });

    onFinish({
      answers,
      idealDacha: "",
      totalSteps,
    });
  };

  return (
    <div className="h-screen bg-black text-white flex items-center justify-center px-5">
      <div className="max-w-md w-full">
        <div className="text-sm text-green-300 mb-3">
          Шаг {step + 1} из {totalSteps}
        </div>

        <h2 className="text-xl mb-6">{current.question}</h2>

        {current.type === "single" && (
          <div className="flex flex-col gap-3">
            {current.answers.map((a, i) => (
              <button
                key={i}
                onClick={() => nextSingle(a)}
                className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-left"
              >
                {a}
              </button>
            ))}
          </div>
        )}

        {current.type === "text_optional" && (
          <div>
            <textarea
              value={idealDacha}
              onChange={(e) => setIdealDacha(e.target.value)}
              placeholder={current.placeholder}
              className="w-full min-h-[120px] bg-white/10 text-white rounded-xl p-4 outline-none resize-none placeholder:text-white/35"
            />

            <p className="mt-3 text-sm text-white/45">{current.helper}</p>

            <div className="mt-5">
              <button
                onClick={idealDacha.trim() ? finishTextStep : skipTextStep}
                className="w-full bg-green-400 text-black p-4 rounded-xl font-semibold"
              >
                {idealDacha.trim() ? "Завершить" : "Пропустить и завершить"}
              </button>
            </div>
          </div>
        )}

        {current.type === "single" && (
          <div className="mt-4 text-sm text-white/40">
            {step + 1} / {closedQuestionsCount + 1}
          </div>
        )}
      </div>
    </div>
  );
}
