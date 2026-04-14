import React from "react";
import { QUIZ_VARIANTS, getActiveVariant } from "./quizVariants";
import {
  calculateProfileForVariant,
  buildResultViewModel,
  buildLeadModalViewModel,
} from "./quizProfiles";

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
  
    const activeVariant = getActiveVariant(tracking.variant);
    const questionsCount = QUIZ_VARIANTS[activeVariant].questions.length;
  
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
      quiz_variant: activeVariant,
      questions_count: questionsCount,
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
          const calculatedProfile = calculateProfileForVariant(
            answers,
            idealDacha,
            activeVariant
          );

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
      quiz_variant: activeVariant,
      segment: tracking.segment,
      medium: tracking.medium,
      campaign: tracking.campaign,
      step_index: currentStepIndex + 1,
      step_count: currentStepIndex + 1,
      questions_count: totalSteps,
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
  const [contact, setContact] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [contactError, setContactError] = React.useState("");
  
  const activeVariant = getActiveVariant(tracking.variant);
  const isVariantB = activeVariant === "b";
  const resultView = buildResultViewModel(profile, activeVariant);
  const leadModalView = buildLeadModalViewModel(activeVariant);

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
      quiz_variant: activeVariant,
      segment: tracking.segment,
      medium: tracking.medium,
      campaign: tracking.campaign,
      lead_offer: activeVariant === "b" ? "legal_report" : "demo_access",
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

  function isValidContact(value) {
    const v = value.trim();
  
    // 📞 Телефон (RU логика)
    const digits = v.replace(/\D/g, "");
    
    // длина 10–12 цифр
    if (digits.length >= 10 && digits.length <= 12) {
      // случай: 10 цифр → должно начинаться с 9
      if (digits.length === 10 && digits.startsWith("9")) {
        return true;
      }
    
      // случай: 11–12 цифр → начинается с 7 или 8, дальше 9
      if (
        (digits.startsWith("7") || digits.startsWith("8")) &&
        digits[1] === "9"
      ) {
        return true;
      }
    }
  
    // 📧 Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(v)) return true;
  
    // 💬 Username (Telegram, Instagram и т.п.)
    const usernameRegex = /@[a-zA-Z0-9_]{3,}/;
    if (usernameRegex.test(v)) return true;
  
    return false;
  }
  
  const handleSubmitContact = () => {
    const value = contact.trim();
  
    if (!value) {
      setContactError(leadModalView.emptyErrorText);
      return;
    }
  
    if (!isValidContact(value)) {
      setContactError(
        "Похоже, контакт введен некорректно. Проверьте, пожалуйста"
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
      quiz_variant: activeVariant,
      segment: tracking.segment,
      medium: tracking.medium,
      campaign: tracking.campaign,
      lead_offer: activeVariant === "b" ? "legal_report" : "demo_access",
      step_index: submission?.step_count || 0,
      step_count: submission?.step_count || 0,
      completed: true,
      cta_clicked: true,
      contact: value,
      answers: submission?.answers || [],
      ideal_dacha: submission?.ideal_dacha || "",
      profile: profile,
      profile_type: profile.dachaType,
    });
  
    setTimeout(() => {
      setSubmitted(false);
      setSending(false);
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
      quiz_variant: activeVariant,
      segment: tracking.segment,
      medium: tracking.medium,
      campaign: tracking.campaign,
      lead_offer: activeVariant === "b" ? "legal_report" : "demo_access",
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

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-5 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          {isVariantB ? (
            <>
              <div className="text-green-300 text-sm mb-3">
                Спасибо за ваши ответы
              </div>

              <h1 className="text-2xl mb-4">
                Спокойствие за дачу начинается с понимания
              </h1>

              <div className="mb-6 text-white text-base leading-relaxed whitespace-pre-line">
                {`Спасибо за ваши ответы.

                Спокойствие за дачу начинается с простого —
                понимания, что с ней всё в порядке.
                
                Особенно с юридической стороны,
                о которой чаще всего вспоминают слишком поздно.
                
                В благодарность за ваши ответы
                наши специалисты подготовят для вас
                бесплатный отчет по вашей даче.`}
              </div>

              <div className="mb-6 bg-white/5 p-4 rounded-xl text-sm text-white/80">
                <div className="mb-2 font-medium text-white">
                  В отчете:
                </div>
                <div className="space-y-1">
                  <div>— проверка юридического состояния</div>
                  <div>— возможные риски и спорные вопросы</div>
                  <div>— рекомендации, на что обратить внимание</div>
                </div>
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
                  ? "Спасибо за проявленный интерес"
                  : "Заказать бесплатный отчет"}
              </button>
            </>
          ) : (
            <>
              <div className="text-green-300 text-sm mb-3">
                Цифровой профиль вашей дачи готов
              </div>

              <h1 className="text-2xl mb-4">{resultView.title}</h1>

              <p className="mb-4 text-white/85 leading-relaxed">
                {resultView.intro}
              </p>

              <p className="mb-4 text-white/80 leading-relaxed">
                {resultView.dachaText}
              </p>

              <div className="mb-5 bg-white/10 border border-white/10 p-4 rounded-2xl">
                <div className="text-sm text-white/40 mb-1">Как сейчас</div>
                <div className="text-white">{resultView.fatigueText}</div>
              </div>

              <div className="mb-5 space-y-3">
                {resultView.problemSolvingText && (
                  <div className="bg-white/5 p-3 rounded-xl">
                    {resultView.problemSolvingText}
                  </div>
                )}

                {resultView.controlStyleText && (
                  <div className="bg-white/5 p-3 rounded-xl">
                    {resultView.controlStyleText}
                  </div>
                )}
              </div>

              <div className="mb-5 bg-green-400/10 border border-green-400/20 p-4 rounded-2xl">
                <div className="text-sm text-green-300 mb-1">Как может быть</div>
                <div className="text-white/90">
                  {resultView.dreamScenarioText}
                </div>
              </div>

              <div className="mb-6 p-4 rounded-2xl bg-green-400/15 border border-green-400/30">
                <div className="text-sm text-green-300 mb-1">Ваш формат</div>
                <div className="text-white font-medium">
                  {resultView.assistantFitText}
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

              <div className="mb-6 text-white text-base leading-relaxed whitespace-pre-line">
                {resultView.ctaBridgeText}
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
                  ? "Спасибо за проявленный интерес"
                  : resultView.ctaButtonText}
              </button>
            </>
          )}
        </div>
      </div>

      {submitted && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-5 z-50">
          <div className="bg-white text-black rounded-3xl p-6 max-w-sm w-full text-center">
      
            <h2 className="text-xl font-semibold mb-4">
              {leadModalView.title}
            </h2>
      
            <p className="text-sm mb-5 text-black/80">
              {leadModalView.description}
            </p>
      
            <div className="text-left text-sm mb-5 space-y-2">
              {leadModalView.bullets.map((item, index) => (
                <div key={index}>— {item}</div>
              ))}
            </div>
      
            <input
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                if (contactError) setContactError("");
              }}
              placeholder={leadModalView.placeholder}
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
              {sending ? "Отправка..." : leadModalView.submitButtonText}
            </button>
      
            <button
              onClick={handleSkipContact}
              className="text-sm text-black/50 underline"
            >
              {leadModalView.skipButtonText}
            </button>
      
          </div>
        </div>
      )}
    </div>
  );
}
