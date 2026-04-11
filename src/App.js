import React from "react";
import { QUIZ_VARIANTS, getActiveVariant } from "./quizVariants";

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
  const resetToIntro = () => {
    setStarted(false);
    setLoading(false);
    setProfile(null);
    setSubmission(null);
  };

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
      variant: activeVariant,
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
        onBackToIntro={resetToIntro}
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

          const activeVariant = getActiveVariant(tracking.variant);
          const calculatedProfile = calculateProfile(answers, idealDacha, activeVariant);

          const submissionPayload = {
            event_type: "quiz_completed",
            user_id: userId,
            session_id: sessionId,
            source: tracking.source,
            variant: activeVariant,
            quiz_variant: activeVariant,
            questions_count: totalSteps,
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
            profile_type: calculatedProfile.dachaType,
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
    <div className="min-h-screen bg-black text-white px-5 py-8">
      <div className="max-w-md mx-auto text-center">
        {/* КАРТИНКА 1 */}
        <img
          src="/hero.jpg"
          alt="Баланс: дела и отдых"
          className="w-full rounded-2xl mb-6"
        />

        {/* ОСНОВНОЙ ТЕКСТ */}
        <p className="text-white text-lg mb-4 leading-relaxed">
          Да, иногда дача — это отдых.
          <br />
          А иногда — бесконечный список дел.
        </p>

        {/* ВТОРИЧНЫЙ ТЕКСТ */}
        <p className="text-white/80 mb-4 leading-relaxed">
          Когда всё на даче под контролем,
          <br />
          Вы больше отдыхаете и меньше волнуетесь.
          <br />
          <br />
          <br />
        </p>

        <p className="text-white/70 mb-4 leading-relaxed">
          Представьте заботливого помощника,
          <br />
          который знает вашу дачу, ничего не забывает
          <br />
          и еще берёт всю рутину на себя.
        </p>

        {/* КАРТИНКА 2 */}
        <img
          src="/hero2.jpg"
          alt="Помощник берет рутину на себя"
          className="w-full max-w-sm mx-auto rounded-2xl mb-6"
        />

        <p className="text-white/60 mb-6 leading-relaxed">
          Он напомнит, подскажет и избавит от лишних забот.
          <br />
          С ним Вы сами выбираете ваш ритм жизни, а не подстраиваетесь
          под обстоятельства.
          <br />
          <br />
        </p>

        <p className="text-white text-lg mb-4 leading-relaxed">
          Ответьте на несколько простых вопросов,
          <br />
          и мы покажем, как он может облегчить жизнь именно Вам.
        </p>

        {/* CTA */}
        <button
          onClick={onStart}
          className="w-full bg-green-400 text-black p-4 rounded-xl font-semibold text-lg hover:scale-105 transition"
        >
          Начать
        </button>
  
        {/* КАРТИНКА 3 */}
        <img
          src="/hero3.jpg"
          alt="Цифровой помощник"
          className="w-full rounded-2xl mb-6"
        />
            
      </div>
    </div>
  );
}

function Quiz({ onFinish, userId, sessionId, tracking }) {
  const activeVariant = getActiveVariant(tracking.variant);
  const questions = QUIZ_VARIANTS[activeVariant].questions;

  const closedQuestionsCount = questions.filter(
    (q) => q.type === "single"
  ).length;

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
      variant: activeVariant,
      segment: tracking.segment,
      medium: tracking.medium,
      campaign: tracking.campaign,
      step_index: currentStepIndex + 1,
      step_count: currentStepIndex + 1,
      completed: false,
      cta_clicked: false,
      question_id: questions[currentStepIndex].id || "",
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

function calculateProfile(answers, idealDacha, variant = "a") {
  const [
    firstThought,
    mainMeaning,
    usage,
    afterWeekend,
    fixingBehavior,
    freedTime,
    assistantStyleAnswer,
    role,
  ] = answers;

  let dachaType = "control";

  if (mainMeaning === "Отдых и тишина") dachaType = "relax";
  else if (mainMeaning === "Свои овощи и зелень к столу") dachaType = "garden";
  else if (mainMeaning === "Ухоженный участок, которым приятно любоваться")
    dachaType = "beauty";
  else if (
    mainMeaning === "Чтобы всё было под контролем и ни о чем не беспокоиться"
  )
    dachaType = "control";

  let mindset = "check";
  if (firstThought === "Наконец-то отдых, хочу расслабиться") mindset = "rest";
  else if (
    firstThought === "Надо проверить участок и всё привести в порядок"
  )
    mindset = "check";
  else if (
    firstThought === "Опять куча дел, вряд ли получится нормально отдохнуть"
  )
    mindset = "tired";
  else if (
    firstThought === "Нравится заниматься участком, это в удовольствие"
  )
    mindset = "joy";

  let usageType = "medium";
  if (
    usage === "Живу здесь постоянно" ||
    usage === "Бываю почти каждые выходные"
  ) {
    usageType = "high";
  } else if (usage === "Приезжаю время от времени") {
    usageType = "medium";
  } else {
    usageType = "low";
  }

  let fatigue = "medium";
  if (afterWeekend === "Чувствую себя скорее уставшим, чем отдохнувшим") {
    fatigue = "high";
  } else if (afterWeekend === "Немножко устал, но доволен") {
    fatigue = "medium";
  } else if (afterWeekend === "Отдохнул и набрался сил") {
    fatigue = "low";
  } else {
    fatigue = "mixed";
  }

  let problemSolving = "search";
  if (fixingBehavior === "Всегда самому интересно этим заняться") {
    problemSolving = "diy";
  } else if (fixingBehavior === "Звоню знакомым мастерам") {
    problemSolving = "trusted";
  } else if (fixingBehavior === "Ищу, кто бы мог это сделать") {
    problemSolving = "search";
  } else if (fixingBehavior === "Всегда откладываю, пока не станет срочно") {
    problemSolving = "procrastinate";
  }

  let dreamScenario = "relax";
  if (freedTime === "Чаще звал бы друзей на шашлыки") {
    dreamScenario = "social";
  } else if (
    freedTime === "Просто лежал бы в гамаке с книгой или любовался природой"
  ) {
    dreamScenario = "relax";
  } else if (
    freedTime ===
    "Занялся бы тем, что мне нравится: сажать редкие цветы, поливать газон…"
  ) {
    dreamScenario = "hobby";
  } else if (
    freedTime === "Ездил бы туда намного реже (чем тогда там еще заниматься?)"
  ) {
    dreamScenario = "leave";
  }

  let assistantStyle = "planner";
  if (
    assistantStyleAnswer ===
    'Он просто молча все делает, а мне присылает отчет: "Готово, хозяин"'
  ) {
    assistantStyle = "silent";
  } else if (
    assistantStyleAnswer ===
    'Он пишет: "Я заметил мох на крыше, и уже подобрал трех мастеров, кого позвать?"'
  ) {
    assistantStyle = "consult";
  } else if (
    assistantStyleAnswer ===
    'Он советует: "Через месяц пора стричь туи, записать в календарь?"'
  ) {
    assistantStyle = "planner";
  } else if (
    assistantStyleAnswer === "Спасибо, но я лучше сам решу, когда и что мне делать"
  ) {
    assistantStyle = "self";
  }

  let controlStyle = "director";
  if (role === "Принимаю решения, но не занимаюсь рутиной") {
    controlStyle = "director";
  } else if (role === "Интересное делаю сам, остальное поручаю другим") {
    controlStyle = "partner";
  } else if (role === "Получаю результат без лишнего моего участия") {
    controlStyle = "owner";
  } else if (role === "Держу всё под личным контролем") {
    controlStyle = "guard";
  }

  let delegationReadiness = "medium";
  if (fatigue === "high" && controlStyle !== "guard") {
    delegationReadiness = "high";
  } else if (fatigue === "medium" || controlStyle === "guard") {
    delegationReadiness = "medium";
  } else {
    delegationReadiness = "low";
  }

  let primaryPain = "uncertainty";
  if (problemSolving === "search" || problemSolving === "trusted") {
    primaryPain = "uncertainty";
  } else if (problemSolving === "procrastinate" || mindset === "tired") {
    primaryPain = "effort";
  } else if (dreamScenario === "social" || dreamScenario === "relax") {
    primaryPain = "time";
  }

  return {
    dachaType,
    mindset,
    usageType,
    fatigue,
    problemSolving,
    dreamScenario,
    assistantStyle,
    controlStyle,
    delegationReadiness,
    primaryPain,
    raw: {
      firstThought,
      mainMeaning,
      usage,
      afterWeekend,
      fixingBehavior,
      freedTime,
      assistantStyleAnswer,
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
  onBackToIntro,
}) {
  const [submitted, setSubmitted] = React.useState(false);
  const [ctaLocked, setCtaLocked] = React.useState(false);

  const mindsetIntro = {
    rest: "«Наконец-то отдых» — эта мысль согревает вас при каждом приезде.",
    check:
      "Вы относитесь к даче ответственно: первым делом — убедиться, что всё в порядке.",
    tired:
      "«Опять куча дел» — знакомое чувство? Вы приезжаете с мыслью о бесконечном списке.",
    joy: "Вам нравится сам процесс заботы об участке — это ваша отдушина.",
  };

  const dachaTypeContent = {
    relax: {
      title: "Ваша дача — это пространство покоя и тишины 🌿",
      text: "Главное здесь — отключиться от городской суеты и восстановить силы.",
    },
    garden: {
      title: "Ваша дача — это источник урожая и пользы 🥕",
      text: "Вы цените возможность выращивать своё, а не только отдыхать.",
    },
    beauty: {
      title: "Ваша дача — это пространство красоты и вдохновения 🌸",
      text: "Для вас важно, чтобы участок радовал глаз и выглядел ухоженно.",
    },
    control: {
      title: "Ваша дача — это зона вашего спокойствия 🏡",
      text: "Вы хотите быть уверены, что всё под контролем, и ничто не отвлекает от отдыха.",
    },
  };

  const fatigueText = {
    high:
      "После выходных вы чувствуете себя уставшим — как будто сменили один вид работы на другой. Это сигнал, что дача забирает больше сил, чем даёт.",
    medium:
      "Вы немного устаёте, но довольны результатом. Однако даже эту усталость можно уменьшить, оставив только приятные хлопоты.",
    low:
      "Вы возвращаетесь отдохнувшим и полным сил — значит, текущий ритм вам подходит.",
    mixed:
      "Бывает по-разному, но в глубине души хочется, чтобы хороших дней было больше.",
  };

  const problemSolvingText = {
    diy:
      "Вы любите разбираться во всём самостоятельно. Вам не нужен тот, кто сделает за вас, но нужен тот, кто подскажет, направит и упростит поиск решений.",
    trusted:
      "У вас есть проверенные мастера, но их контакты не всегда под рукой, а иногда их занятость подводит.",
    search:
      "Каждый раз поиск исполнителя превращается в квест. Это отнимает время и нервы, которых на даче должно быть в избытке.",
    procrastinate:
      "Вы откладываете задачи до последнего, потому что не хочется тратить на это драгоценные выходные. Знакомо?",
  };

  const controlStyleText = {
    director:
      "Вы — Режиссёр. Вы принимаете ключевые решения, но не хотите погружаться в рутину поиска и контроля. Вам нужен надёжный «второй пилот».",
    partner:
      "Вы — Партнёр. Всё интересное вы делаете сами, а скучное и техническое готовы доверить тому, кто разбирается.",
    owner:
      "Вы — Владелец. Вам важен результат: красивый участок и работающие системы. Как это достигается — не ваша забота.",
    guard:
      "Вы — Хранитель порядка. Вам важно держать руку на пульсе и быть в курсе всего, что происходит. Но даже Хранителю нужен надёжный инструмент наблюдения и подсказок.",
  };

  const dreamScenarioText = {
    social:
      "Если освободить время, вы бы чаще звали друзей на шашлыки и наслаждались общением.",
    relax:
      "Если освободить время, вы бы просто лежали в гамаке с книгой или любовались природой — без чувства вины.",
    hobby:
      "Если освободить время, вы бы занялись тем, что вам по-настоящему нравится: редкие цветы, уход за газоном, создание уюта.",
    leave:
      "Честно говоря, если бы дача не требовала столько сил, вы бы, возможно, ездили туда гораздо реже. Но ситуацию можно изменить, не отказываясь от дачи.",
  };

  const assistantFitText = {
    silent:
      "Вам подходит помощник, который действует тихо и присылает только отчёт: «Готово, можно отдыхать».",
    consult:
      "Вам подходит помощник, который замечает важное, предлагает варианты и спрашивает ваше решение.",
    planner:
      "Вам подходит помощник-планировщик: он напоминает о сезонных делах и помогает ничего не упустить.",
    self:
      "Вы предпочитаете решать всё сами, но даже в этом случае иметь под рукой базу знаний и проверенных мастеров — никогда не лишнее.",
  };

  const ctaBridgeText = {
    high:
      "Если вы хотите, чтобы дача перестала забирать силы и начала приносить чистое удовольствие — этот помощник создан для вас.",
    medium:
      "Даже если вы отлично справляетесь сами, иметь под рукой того, кто ничего не забывает и вовремя подскажет — значит сохранить силы для того, что вам действительно важно. Хотите посмотреть, как это будет работать именно для вашей дачи?",
    low: `Вы хорошо чувствуете свою дачу.
    
    Но иногда даже опытным дачникам не хватает одной вещи —
    чтобы кто-то вовремя подсказал.
    
    Напомнил о заморозках, ❄️
    посоветовал удачный сорт 🌱
    или просто подкинул идею для отличного шашлыка. 🔥
    
    Такой «цифровой сосед», с которым проще и интереснее.
    
    Хотите посмотреть, как это может работать у вас?`,
  };

  const ctaButtonText = {
    high: "Да, хочу посмотреть, как это работает",
    medium: "Да, покажите, что он умеет",
    low: "Посмотреть возможности помощника",
  };

  const data = dachaTypeContent[profile.dachaType];

  const handleInterested = () => {
    if (ctaLocked) return;

    setCtaLocked(true);
    setSubmitted(true);

    sendEvent({
      event_type: "cta_clicked",
      user_id: userId,
      session_id: sessionId,
      source: tracking.source,
      variant: activeVariant,
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
      profile_type: profile.dachaType,
    });
  };
  
  const handleSubmitContact = () => {
    if (!contact.trim()) {
      setContactError(
        "Пожалуйста, укажите контакт, чтобы мы могли отправить вам демонстрацию"
      );
      return;
    }
    
    setContactError("");
    
    setSending(true);
  
    sendEvent({
      event_type: "lead_submitted",
      user_id: userId,
      session_id: sessionId,
      source: tracking.source,
      variant: activeVariant,
      segment: tracking.segment,
      medium: tracking.medium,
      campaign: tracking.campaign,
      step_index: submission?.step_count || 0,
      step_count: submission?.step_count || 0,
      completed: true,
      cta_clicked: true,
      contact: contact.trim(),
      answers: submission?.answers || [],
      ideal_dacha: submission?.ideal_dacha || "",
      profile: profile,
      profile_type: profile.dachaType,
    });
  
    setTimeout(() => {
      setSubmitted(false);
      onBackToIntro();
    }, 800);
  };

  const handleSkipContact = () => {
    sendEvent({
      event_type: "lead_skipped",
      user_id: userId,
      session_id: sessionId,
      source: tracking.source,
      variant: activeVariant,
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
      profile_type: profile.dachaType,
    });
  
    setSubmitted(false);
    onBackToIntro();
  };

  const [contact, setContact] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [contactError, setContactError] = React.useState("");

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-5 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <div className="text-green-300 text-sm mb-3">
            Цифровой профиль вашей дачи готов
          </div>

          <h1 className="text-2xl mb-4">{data.title}</h1>

          <p className="mb-4 text-white/85 leading-relaxed">
            {mindsetIntro[profile.mindset]}
          </p>

          <p className="mb-4 text-white/80 leading-relaxed">
            {data.text}
          </p>

          <div className="mb-5 bg-white/10 border border-white/10 p-4 rounded-2xl">
            <div className="text-sm text-white/40 mb-1">Как сейчас</div>
            <div className="text-white">{fatigueText[profile.fatigue]}</div>
          </div>

          <div className="mb-5 space-y-3">
            <div className="bg-white/5 p-3 rounded-xl">
              {problemSolvingText[profile.problemSolving]}
            </div>
          
            <div className="bg-white/5 p-3 rounded-xl">
              {controlStyleText[profile.controlStyle]}
            </div>
          </div>

          <div className="mb-5 bg-green-400/10 border border-green-400/20 p-4 rounded-2xl">
            <div className="text-sm text-green-300 mb-1">Как может быть</div>
            <div className="text-white/90">
              {dreamScenarioText[profile.dreamScenario]}
            </div>
          </div>

          <div className="mb-6 p-4 rounded-2xl bg-green-400/15 border border-green-400/30">
            <div className="text-sm text-green-300 mb-1">Ваш формат</div>
            <div className="text-white font-medium">
              {assistantFitText[profile.assistantStyle]}
            </div>
          </div>

          {profile.raw.idealDacha && (
            <div className="mb-6 rounded-2xl bg-green-400/10 border border-green-400/20 p-4">
              <div className="text-sm text-green-300 mb-2">
                Ваша идеальная дача
              </div>
              <div className="text-white/90 italic">
                “{profile.raw.idealDacha}”
              </div>
            </div>
          )}

          <div className="mb-6 text-white text-base leading-relaxed">
            {ctaBridgeText[profile.delegationReadiness]}
          </div>

          <button
            onClick={handleInterested}
            disabled={ctaLocked}
            className={`w-full p-4 rounded-xl font-semibold text-base transition transform ${
              ctaLocked
                ? "bg-green-300 text-black/60 cursor-not-allowed"
                : "bg-green-400 text-black hover:scale-105"
            }`}
          >
            {ctaLocked
              ? "Интерес уже зафиксирован"
              : ctaButtonText[profile.delegationReadiness]}
          </button>
        </div>
      </div>

      {submitted && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-5 z-50">
          <div className="bg-white text-black rounded-3xl p-6 max-w-sm w-full text-center">
      
            <h2 className="text-xl font-semibold mb-4">
              Мы подготовили для вас персональную демонстрацию
            </h2>
      
            <p className="text-sm mb-5 text-black/80">
              На основе ваших ответов мы собрали короткий сценарий,
              в котором видно, как помощник будет работать именно с вашей дачей.
            </p>
      
            <div className="text-left text-sm mb-5 space-y-2">
              <div>— подсказывает в нужный момент</div>
              <div>— помогает не забывать важное</div>
              <div>— освобождает ваше время</div>
            </div>
      
            <input
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                if (contactError) setContactError("");
              }}
              placeholder="Телефон или почта или мессенджер"
              className="w-full border border-black/20 rounded-xl p-3 mb-2 outline-none"
            />
              
            {contactError && (
              <div className="text-red-500 text-sm mb-3 text-left">
                {contactError}
              </div>
            )}
                
            <button
              onClick={handleSubmitContact}
              disabled={sending}
              className="w-full bg-black text-white p-3 rounded-xl mb-3"
            >
              {sending ? "Отправка..." : "Получить доступ к демонстрации"}
            </button>
      
            <button
              onClick={handleSkipContact}
              className="text-sm text-black/50 underline"
            >
              Я еще подумаю...
            </button>
      
          </div>
        </div>
      )}
    </div>
  );
}
