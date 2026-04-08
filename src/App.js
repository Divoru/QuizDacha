import React from "react";

const WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbwAVOPk1Iz6Cnx90NSfeFlhnY9EgLJZzuUFInSnI7pADi7PqR6Lg5_DVk-HnoablJv9/exec";

const QUIZ_VERSION = "v3_lifestyle";

function generateId() {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10)
  );
}

function getUserId() {
  const key = "dd_user_id";
  let userId = localStorage.getItem(key);

  if (!userId) {
    userId = generateId();
    localStorage.setItem(key, userId);
  }

  return userId;
}

function hasCompletedQuiz(userId) {
  if (!userId) return false;
  return localStorage.getItem(`dd_quiz_completed_${userId}`) === "true";
}

function markQuizCompleted(userId) {
  if (!userId) return;
  localStorage.setItem(`dd_quiz_completed_${userId}`, "true");
}

function getTrackingParams() {
  const params = new URLSearchParams(window.location.search);

  return {
    source:
      params.get("utm_source") ||
      params.get("source") ||
      params.get("src") ||
      "",
    variant:
      params.get("utm_campaign") ||
      params.get("variant") ||
      params.get("v") ||
      "",
    segment:
      params.get("utm_content") ||
      params.get("segment") ||
      params.get("seg") ||
      "",
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
  const [userId, setUserId] = React.useState(null);
  const tracking = React.useMemo(() => getTrackingParams(), []);
  const [sessionId, setSessionId] = React.useState(null);

  const [started, setStarted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [profile, setProfile] = React.useState(null);
  const [submission, setSubmission] = React.useState(null);
  const [showRepeatModal, setShowRepeatModal] = React.useState(false);

  React.useEffect(() => {
    const id = getUserId();
    setUserId(id);
  }, []);

  const beginQuizSession = () => {
    if (!userId) return;
  
    const newSessionId = generateId();
    setSessionId(newSessionId);
  
    setStarted(true);
    setLoading(false);
    setProfile(null);
    setSubmission(null);
    setShowRepeatModal(false);
  
    sendEvent({
      event_type: "quiz_started",
      user_id: userId,
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
  
  const handleStart = () => {
    if (!userId) return;
  
    if (hasCompletedQuiz(userId)) {
      setShowRepeatModal(true);
      return;
    }
  
    beginQuizSession();
  };

  if (loading) return <LoadingScreen />;

  if (profile) {
    return (
      <ResultScreen
        profile={profile}
        submission={submission}
        userId={userId}
        sessionId={sessionId}
        tracking={tracking}
      />
    );
  }

  if (started) {
    return (
      <Quiz
        userId={userId}
        sessionId={sessionId}
        tracking={tracking}
        onFinish={({ answers, idealDacha, totalSteps }) => {
          setLoading(true);

          const calculatedProfile = calculateProfile(answers, idealDacha);

          const submissionPayload = {
            event_type: "quiz_completed",
            user_id: userId,
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
          markQuizCompleted(userId);

          setTimeout(() => {
            setProfile(calculatedProfile);
            setLoading(false);
          }, 2500);
        }}
      />
    );
  }

  return (
    <>
      <IntroScreen onStart={handleStart} />
  
      {showRepeatModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-5 z-50">
          <div className="bg-white text-black rounded-3xl p-6 max-w-sm w-full text-center">
            <h2 className="text-xl font-semibold mb-4">
              Вы уже проходили этот опрос
            </h2>
  
            <p className="text-sm mb-6">
              Похоже, вы уже заполняли этот квиз с этого устройства.
              Хотите пройти его ещё раз?
            </p>
  
            <div className="flex flex-col gap-3">
              <button
                onClick={beginQuizSession}
                className="w-full bg-black text-white p-3 rounded-xl"
              >
                Да, пройти ещё раз
              </button>
  
              <button
                onClick={() => setShowRepeatModal(false)}
                className="w-full bg-gray-200 text-black p-3 rounded-xl"
              >
                Нет, не сейчас
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function IntroScreen({ onStart }) {
  return (
    <div className="h-screen bg-black text-white flex items-center justify-center px-5">
      <div className="max-w-md text-center">
        <div className="text-green-300 text-sm mb-3">Единое окно</div>

        <h1 className="text-2xl mb-6">Цифровой помощник для вашей дачи</h1>

        <p className="text-white/80 mb-4">
          Он поможет сделать дачу удобнее именно для Вас: подскажет, что важно,
          напомнит о нужном и избавит от лишних забот.
        </p>

        <p className="text-white/55 mb-8 text-sm">
          Пройдите короткий тест — и помощник лучше поймёт Вашу дачу и Ваш образ
          жизни.
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
      user_id: userId,
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

function LoadingScreen() {
  return (
    <div className="h-screen bg-black text-white flex items-center justify-center px-5 text-center">
      <div>
        <h1 className="mb-6 text-xl">
          Настраиваем цифровой профиль вашей дачи...
        </h1>

        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-green-400 animate-pulse w-full"></div>
        </div>

        <p className="text-sm text-white/50">
          Анализируем ответы и собираем персональный профиль
        </p>
      </div>
    </div>
  );
}

function calculateProfile(answers, idealDacha) {
  const [
    firstThought,
    mainMeaning,
    usage,
    afterWeekend,
    fixingBehavior,
    freedTime,
    assistantStyle,
    role,
  ] = answers;

  let type = "comfort";

  if (mainMeaning === "Отдых и тишина") type = "relax";
  else if (mainMeaning === "Свои овощи и зелень к столу") type = "garden";
  else if (
    mainMeaning === "Ухоженный участок, которым приятно любоваться"
  )
    type = "beauty";
  else if (
    mainMeaning === "Чтобы всё было под контролем и ни о чем не беспокоиться"
  )
    type = "control";

  let emotionalEntry = "neutral";
  if (firstThought === "Наконец-то отдых, хочу расслабиться")
    emotionalEntry = "rest";
  else if (firstThought === "Надо проверить участок и всё привести в порядок")
    emotionalEntry = "control";
  else if (
    firstThought === "Опять куча дел, вряд ли получится нормально отдохнуть"
  )
    emotionalEntry = "overload";
  else if (firstThought === "Нравится заниматься участком, это в удовольствие")
    emotionalEntry = "enthusiast";

  let usageType = "medium";
  if (
    usage === "Живу здесь постоянно" ||
    usage === "Бываю почти каждые выходные"
  )
    usageType = "high";
  else if (usage === "Приезжаю время от времени") usageType = "medium";
  else usageType = "low";

  let fatigue = "medium";
  if (afterWeekend === "Чувствую себя скорее уставшим, чем отдохнувшим")
    fatigue = "high";
  else if (afterWeekend === "Немножко устал, но доволен")
    fatigue = "medium";
  else if (afterWeekend === "Отдохнул и набрался сил") fatigue = "low";
  else fatigue = "variable";

  let behavior = "mixed";
  if (fixingBehavior === "Всегда самому интересно этим заняться")
    behavior = "diy";
  else if (fixingBehavior === "Звоню знакомым мастерам")
    behavior = "trusted";
  else if (fixingBehavior === "Ищу, кто бы мог это сделать")
    behavior = "search";
  else if (fixingBehavior === "Всегда откладываю, пока не станет срочно")
    behavior = "avoid";

  let desire = "rest";
  if (freedTime === "Чаще звал бы друзей на шашлыки") desire = "social";
  else if (
    freedTime === "Просто лежал бы в гамаке с книгой или любовался природой"
  )
    desire = "silence";
  else if (
    freedTime ===
    "Занялся бы тем, что мне нравится: сажать редкие цветы, поливать газон…"
  )
    desire = "favorite";
  else if (
    freedTime === "Ездил бы туда намного реже (чем тогда там еще заниматься?)"
  )
    desire = "distance";

  let assistantMode = "planner";
  if (
    assistantStyle ===
    'Он просто молча все делает, а мне присылает отчет: "Готово, хозяин"'
  )
    assistantMode = "done_for_you";
  else if (
    assistantStyle ===
    'Он пишет: "Я заметил мох на крыше, и уже подобрал трех мастеров, кого позвать?"'
  )
    assistantMode = "coordinator";
  else if (
    assistantStyle ===
    'Он советует: "Через месяц пора стричь туи, записать в календарь?"'
  )
    assistantMode = "planner";
  else if (
    assistantStyle === "Спасибо, но я лучше сам решу, когда и что мне делать"
  )
    assistantMode = "observer";

  let ownershipStyle = "director";
  if (
    role ===
    "Режиссер: Принимаю ключевые решения, но не занимаюсь рутиной и бытовухой"
  )
    ownershipStyle = "director";
  else if (
    role ===
    "Партнер: Делаю все интересное сам, скучное пускай делает помощник"
  )
    ownershipStyle = "partner";
  else if (
    role === "Владелец: Хочу получать результат без лишнего моего участия"
  )
    ownershipStyle = "owner";
  else if (
    role === "Сторож: Мне спокойнее, если я сам все буду контролировать"
  )
    ownershipStyle = "guard";

  let readiness = "medium";
  if (assistantMode === "done_for_you" || assistantMode === "coordinator")
    readiness = "high";
  else if (assistantMode === "planner") readiness = "medium";
  else readiness = "low";

  return {
    type,
    emotionalEntry,
    usageType,
    fatigue,
    behavior,
    desire,
    assistantMode,
    ownershipStyle,
    readiness,
    raw: {
      firstThought,
      mainMeaning,
      usage,
      afterWeekend,
      fixingBehavior,
      freedTime,
      assistantStyle,
      role,
      idealDacha: idealDacha || "",
    },
  };
}

function ResultScreen({
  profile,
  submission,
  userId,
  sessionId,
  tracking,
}) {
  const [submitted, setSubmitted] = React.useState(false);

  const typeContent = {
    relax: {
      title: "Вы хотите, чтобы дача возвращала силы 🌿",
      intro:
        "Для вас дача — это прежде всего место, где хочется выдохнуть, почувствовать тишину и побыть в хорошем состоянии.",
    },
    garden: {
      title: "Для вас дача — это польза, вкус и результат 🥕",
      intro:
        "Вам важно, чтобы дача приносила не только эмоции, но и ощутимый результат: урожай, порядок, чувство хозяйского смысла.",
    },
    beauty: {
      title: "Ваша дача — это пространство красоты и удовольствия 🌸",
      intro:
        "Для вас важно, чтобы участок выглядел красиво, гармонично и радовал глаз — чтобы на него хотелось смотреть и возвращаться.",
    },
    control: {
      title: "Вам важны спокойствие и уверенность в даче 🏡",
      intro:
        "Для вас дача — это место, где всё должно быть предсказуемо, понятно и под контролем, без лишней суеты.",
    },
  };

  const fatigueText = {
    high: "Сейчас дача, вероятно, забирает у вас больше сил, чем хотелось бы.",
    medium:
      "Сейчас дача приносит и удовольствие, и нагрузку — баланс пока неидеален.",
    low: "У вас уже есть хорошая база для комфортной дачи, и её можно сделать еще приятнее.",
    variable:
      "Похоже, многое зависит от сезона, задач и текущего состояния участка.",
  };

  const behaviorText = {
    diy: "Вы не боитесь участвовать сами и цените ощущение личного участия.",
    trusted:
      "Вы привыкли решать многое через проверенных людей и доверие для вас очень важно.",
    search:
      "Сейчас одна из главных сложностей — каждый раз заново искать, кому можно доверить задачу.",
    avoid:
      "Похоже, часть вопросов хочется просто отодвинуть подальше и не тратить на них силы.",
    mixed: "Ваш подход к даче гибкий, но не всегда системный.",
  };

  const assistantText = {
    done_for_you:
      "Вам ближе формат, в котором помощник берет рутину на себя и оставляет вам только результат.",
    coordinator:
      "Вам нужен помощник, который замечает важное заранее и помогает быстро принять решение.",
    planner:
      "Вам ближе спокойный формат подсказок, напоминаний и понятного плана.",
    observer:
      "Вам важно сохранить контроль, но при этом видеть картину целиком и ничего не упускать.",
  };

  const roleText = {
    director:
      "Вы — Режиссер: любите управлять важным, но не хотите тратить себя на бытовую рутину.",
    partner:
      "Вы — Партнер: интересное хочется оставить себе, а скучное — делегировать.",
    owner:
      "Вы — Владелец: для вас важен итоговый результат, а не процесс.",
    guard:
      "Вы — Сторож: чувство контроля для вас важнее удобства.",
  };

  const desireText = {
    social:
      "Если освободить ваши силы, дача станет более живой, гостеприимной и радостной.",
    silence:
      "Если убрать лишние заботы, дача сможет по-настоящему стать местом отдыха и тишины.",
    favorite:
      "Если снять рутину, вы сможете оставить себе только то, что действительно нравится.",
    distance:
      "Сейчас дача, возможно, требует от вас больше, чем дает. Здесь особенно важен помощник, который снижает нагрузку.",
  };

  const ctaText = {
    high:
      "Похоже, формат цифрового помощника вам действительно близок — особенно если он будет простым, понятным и полезным.",
    medium:
      "Такой помощник может хорошо вам подойти, если будет помогать без перегруза и лишних уведомлений.",
    low:
      "Даже если вам не нужен “сервис ради сервиса”, помощник может быть полезен как тихий инструмент контроля и подсказок.",
  };

  const data = typeContent[profile.type];

  const handleInterested = () => {
    setSubmitted(true);

    sendEvent({
      event_type: "cta_clicked",
      user_id: userId,
      session_id: sessionId,
      source: tracking.source,
      variant: tracking.variant,
      segment: tracking.segment,
      medium: tracking.medium,
      campaign: tracking.campaign,
      step_index: submission?.step_count || 0,
      step_count: submission?.step_count || 0,
      completed: true,
      cta_clicked: true,
      answers: submission?.answers || [],
      ideal_dacha: submission?.ideal_dacha || "",
      profile: profile,
      profile_type: profile.type,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-5 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <div className="text-green-300 text-sm mb-3">
            Цифровой профиль вашей дачи готов
          </div>

          <h1 className="text-2xl mb-4">{data.title}</h1>

          <p className="mb-4 text-white/80">{data.intro}</p>

          <div className="space-y-3 mb-6">
            <div className="bg-white/10 p-3 rounded-xl">
              {fatigueText[profile.fatigue]}
            </div>

            <div className="bg-white/10 p-3 rounded-xl">
              {behaviorText[profile.behavior]}
            </div>

            <div className="bg-white/10 p-3 rounded-xl">
              {assistantText[profile.assistantMode]}
            </div>

            <div className="bg-white/10 p-3 rounded-xl">
              {roleText[profile.ownershipStyle]}
            </div>
          </div>

          {profile.raw.idealDacha && (
            <div className="mb-6 rounded-2xl bg-green-400/10 border border-green-400/20 p-4">
              <div className="text-sm text-green-300 mb-2">
                Ваша дача мечты
              </div>
              <div className="text-white/90 italic">
                “{profile.raw.idealDacha}”
              </div>
            </div>
          )}

          <p className="mb-4 text-white/70">{desireText[profile.desire]}</p>

          <p className="mb-6 text-white/65">{ctaText[profile.readiness]}</p>

          <div className="mb-4 text-white/55 text-sm">
            Если вам интересно, как такой помощник мог бы работать именно для
            вашей дачи — можно оставить предварительный интерес. Мы покажем, как
            это может выглядеть на практике.
          </div>

          <button
            onClick={handleInterested}
            className="w-full bg-green-400 text-black p-4 rounded-xl font-semibold"
          >
            Да, мне интересен такой помощник
          </button>
        </div>
      </div>

      {submitted && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-5 z-50">
          <div className="bg-white text-black rounded-3xl p-6 max-w-sm w-full text-center">
            <h2 className="text-xl font-semibold mb-4">
              Интерес зафиксирован ✅
            </h2>

            <p className="text-sm mb-6">
              Спасибо. Мы увидели ваш интерес и свяжемся с вами, когда будем
              готовы показать, как такой цифровой помощник может работать именно
              для вашей дачи.
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
