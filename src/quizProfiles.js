function calculateProfileA(answers, idealDacha) {
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

function buildResultViewModelA(profile) {
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

  return {
    title: dachaTypeContent[profile.dachaType]?.title || "",
    intro: mindsetIntro[profile.mindset] || "",
    dachaText: dachaTypeContent[profile.dachaType]?.text || "",
    fatigueText: fatigueText[profile.fatigue] || "",
    problemSolvingText: problemSolvingText[profile.problemSolving] || "",
    controlStyleText: controlStyleText[profile.controlStyle] || "",
    dreamScenarioText: dreamScenarioText[profile.dreamScenario] || "",
    assistantFitText: assistantFitText[profile.assistantStyle] || "",
    ctaBridgeText: ctaBridgeText[profile.delegationReadiness] || "",
    ctaButtonText: ctaButtonText[profile.delegationReadiness] || "Узнать больше",
  };
}
function calculateProfileB(answers, idealDacha) {
  const [
    dachaRole,
    priority,
    usage,
    dayReality,
    problemSolving,
    mainValue,
    recentChanges,
  ] = answers;

  let dachaType = "control";
  if (priority === "Отдых, друзья, баня") dachaType = "relax";
  else if (priority === "Огород и урожай") dachaType = "garden";
  else if (priority === "Красивый участок") dachaType = "beauty";
  else dachaType = "control";

  let mindset = "balanced";
  if (dachaRole === "Отдых и расслабление") mindset = "rest";
  else if (dachaRole === "Место для дел и забот") mindset = "burden";
  else mindset = "balanced";

  let usageType = "medium";
  if (usage === "Живу или бываю часто") usageType = "high";
  else if (usage === "Приезжаю на выходные") usageType = "medium";
  else usageType = "low";

  let fatigue = "medium";
  if (dayReality === "Постоянно что-то нужно делать") fatigue = "high";
  else if (dayReality === "Иногда отвлекают бытовые задачи") fatigue = "medium";
  else if (dayReality === "В основном отдыхаю") fatigue = "low";
  else fatigue = "mixed";

  let problemSolvingStyle = "search";
  if (problemSolving === "Сам") problemSolvingStyle = "diy";
  else if (problemSolving === "Через знакомых") problemSolvingStyle = "trusted";
  else if (problemSolving === "Каждый раз ищу заново") problemSolvingStyle = "search";
  else if (problemSolving === "Стараюсь не заниматься") problemSolvingStyle = "avoid";

  let dreamScenario = "rest";
  if (mainValue === "Чтобы всё работало без моего участия") dreamScenario = "automation";
  else if (mainValue === "Чтобы не искать мастеров") dreamScenario = "execution";
  else if (mainValue === "Чтобы участок был красивым") dreamScenario = "beauty";
  else if (mainValue === "Чтобы было больше времени на отдых") dreamScenario = "time";

  let developmentLevel = "stable";
  if (recentChanges === "Несколько новых построек") developmentLevel = "active_growth";
  else if (recentChanges === "Одна постройка") developmentLevel = "growing";
  else if (recentChanges === "Ничего нового") developmentLevel = "stable";
  else if (recentChanges === "Только мелкие доработки") developmentLevel = "light_updates";

  let delegationReadiness = "medium";
  if (
    (fatigue === "high" || mindset === "burden") &&
    (problemSolvingStyle === "search" || problemSolvingStyle === "avoid")
  ) {
    delegationReadiness = "high";
  } else if (fatigue === "low" && problemSolvingStyle === "diy") {
    delegationReadiness = "low";
  } else {
    delegationReadiness = "medium";
  }

  return {
    dachaType,
    mindset,
    usageType,
    fatigue,
    problemSolving: problemSolvingStyle,
    dreamScenario,
    developmentLevel,
    delegationReadiness,
    raw: {
      dachaRole,
      priority,
      usage,
      dayReality,
      problemSolving,
      mainValue,
      recentChanges,
      idealDacha: idealDacha || "",
    },
  };
}
export function calculateProfileForVariant(answers, idealDacha, variant = "a") {
  if (variant === "b") {
    return calculateProfileB(answers, idealDacha);
  }

  return calculateProfileA(answers, idealDacha);
}
function buildResultViewModelB(profile) {
  const titleMap = {
    relax: "Для вас дача — это место отдыха и восстановления 🌿",
    garden: "Для вас дача — это польза, урожай и результат 🥕",
    beauty: "Для вас дача — это красота, уют и ухоженность 🌸",
    control: "Для вас дача — это порядок, надежность и спокойствие 🏡",
  };

  const introMap = {
    rest:
      "Вы воспринимаете дачу как пространство, где хочется выдохнуть и отключиться от повседневной суеты.",
    burden:
      "Похоже, дача для вас — это не только удовольствие, но и зона постоянных забот, решений и ответственности.",
    balanced:
      "Вы смотрите на дачу трезво: это и радость, и задачи, которые хочется держать в разумном балансе.",
  };

  const dachaTextMap = {
    relax:
      "Главная ценность для вас — отдых, близкие люди и ощущение, что всё вокруг помогает расслабиться, а не загружает ещё сильнее.",
    garden:
      "Для вас важно, чтобы дача приносила реальный результат: урожай, пользу и ощущение, что всё делается не зря.",
    beauty:
      "Для вас важно, чтобы участок радовал глаз, выглядел ухоженно и создавал приятное ощущение порядка и гармонии.",
    control:
      "Для вас важно, чтобы на даче всё было понятно, исправно и не превращалось в источник неожиданных проблем.",
  };

  const fatigueTextMap = {
    high:
      "Сейчас дача, скорее всего, требует от вас слишком много участия. Это значит, что часть сил уходит не на удовольствие, а на постоянное удержание всего в рабочем состоянии.",
    medium:
      "Сейчас дача приносит и удовольствие, и нагрузку. Но уже видно, что часть забот можно было бы снять без потери контроля.",
    low:
      "У вас уже есть неплохой уровень комфорта. Значит, дальше можно не спасать ситуацию, а спокойно усиливать удобство и качество жизни.",
    mixed:
      "Похоже, всё сильно зависит от сезона и текущих задач. В хорошие периоды дача радует, в напряжённые — быстро начинает забирать внимание.",
  };

  const problemSolvingTextMap = {
    diy:
      "Вы привыкли опираться на себя. Это даёт контроль, но часто требует лишнего времени и включённости.",
    trusted:
      "Вы решаете вопросы через знакомых и проверенные контакты. Это удобно, но не всегда быстро и системно.",
    search:
      "Каждый новый вопрос часто требует нового поиска. Это один из самых утомительных сценариев для владельца дачи.",
    avoid:
      "Похоже, часть вопросов хочется просто отодвинуть — не потому что они не важны, а потому что на них не хочется тратить силы.",
  };

  const dreamScenarioTextMap = {
    automation:
      "Самая ценная перспектива для вас — чтобы дача оставалась в порядке без постоянного личного участия.",
    execution:
      "Для вас особенно важно не тратить силы на поиск людей и повторные объяснения — а сразу получать понятное решение.",
    beauty:
      "Если убрать лишние заботы, больше энергии останется на то, чтобы участок действительно выглядел так, как вам хочется.",
    time:
      "Если высвободить часть усилий, дача сможет снова стать местом отдыха, а не вторым списком дел на выходные.",
  };

  const assistantFitTextMap = {
    high:
      "Вам подойдёт помощник, который не просто напоминает, а помогает быстро наводить порядок в вопросах по даче и снижает объём лишнего участия с вашей стороны.",
    medium:
      "Вам подойдёт помощник, который помогает держать всё в поле зрения, подсказывает важное и экономит время на рутинных решениях.",
    low:
      "Даже если вы привыкли справляться сами, такой помощник может быть полезен как спокойный инструмент наблюдения, памяти и своевременных подсказок.",
  };

  const ctaBridgeTextMap = {
    high:
      "Спасибо за ваши ответы.\n\n" +
      "Спокойствие за дачу начинается с простого —\n" +
      "понимания, что с ней всё в порядке.\n\n" +
      "Особенно с юридической стороны,\n" +
      "о которой чаще всего вспоминают слишком поздно.\n\n" +
      "Короткий отчет поможет увидеть текущую картину\n" +
      "и заранее понять, где могут быть возможные вопросы.",
    medium:
      "Спасибо за ваши ответы.\n\n" +
      "Спокойствие за дачу начинается с простого —\n" +
      "понимания, что с ней всё в порядке.\n\n" +
      "Особенно с юридической стороны,\n" +
      "о которой чаще всего вспоминают слишком поздно.\n\n" +
      "Короткий отчет поможет увидеть текущую картину\n" +
      "и заранее понять, где могут быть возможные вопросы.",
    low:
      "Спасибо за ваши ответы.\n\n" +
      "Спокойствие за дачу начинается с простого —\n" +
      "понимания, что с ней всё в порядке.\n\n" +
      "Особенно с юридической стороны,\n" +
      "о которой чаще всего вспоминают слишком поздно.\n\n" +
      "Короткий отчет поможет увидеть текущую картину\n" +
      "и заранее понять, где могут быть возможные вопросы.",
  };

  return {
    title: titleMap[profile.dachaType] || "Цифровой профиль вашей дачи готов",
    intro: introMap[profile.mindset] || "",
    dachaText: dachaTextMap[profile.dachaType] || "",
    fatigueText: fatigueTextMap[profile.fatigue] || "",
    problemSolvingText: problemSolvingTextMap[profile.problemSolving] || "",
    controlStyleText: "",
    dreamScenarioText: dreamScenarioTextMap[profile.dreamScenario] || "",
    assistantFitText: assistantFitTextMap[profile.delegationReadiness] || "",
    ctaBridgeText: ctaBridgeTextMap[profile.delegationReadiness] || "",
    ctaButtonText: "Заказать бесплатный отчет.",
  };
}
export function buildResultViewModel(profile, variant = "a") {
  if (variant === "b") {
    return buildResultViewModelB(profile);
  }

  return buildResultViewModelA(profile);
}
export function buildLeadModalViewModel(variant = "a") {
  if (variant === "b") {
    return {
      title: "Куда отправить отчет по вашей даче?",
      description:
        "На основе ваших ответов мы подготовим для вас короткий отчет по даче и передадим его нашему кадастровому инженеру для бесплатной юридической проверки.",
      bullets: [
        "на что обратить внимание в первую очередь",
        "где могут быть возможные юридические вопросы",
      ],
      placeholder: "Телефон или почта или мессенджер",
      submitButtonText: "Получить бесплатный отчет на 01.04.2026",
      skipButtonText: "Я еще подумаю...",
      emptyErrorText:
        "Пожалуйста, укажите контакт, чтобы мы могли отправить вам отчет",
    };
  }

  return {
    title: "Мы подготовили для вас персональную демонстрацию",
    description:
      "На основе ваших ответов мы собрали короткий сценарий, в котором видно, как помощник будет работать именно с вашей дачей.",
    bullets: [
      "подсказывает в нужный момент",
      "помогает не забывать важное",
      "освобождает ваше время",
    ],
    placeholder: "Телефон или почта или мессенджер",
    submitButtonText: "Получить доступ к демонстрации",
    skipButtonText: "Я еще подумаю...",
    emptyErrorText:
      "Пожалуйста, укажите контакт, чтобы мы могли отправить вам демонстрацию",
  };
}
