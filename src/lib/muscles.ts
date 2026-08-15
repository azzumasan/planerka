export type ActivationLevel = "primary" | "secondary" | "stabilizer";

export type MuscleId =
  // Плечевой пояс
  | "traps_upper"
  | "traps_mid"
  | "traps_low"
  | "rhomboids"
  | "delt_front"
  | "delt_side"
  | "delt_rear"
  | "teres"
  // Грудь
  | "chest_upper"
  | "chest_mid"
  | "chest_low"
  | "serratus"
  // Спина
  | "lats_upper"
  | "lats_lower"
  | "erector"
  // Руки
  | "biceps_long"
  | "biceps_short"
  | "brachialis"
  | "triceps_long"
  | "triceps_lateral"
  | "triceps_medial"
  | "forearm_flexors"
  | "forearm_extensors"
  // Корпус
  | "abs_upper"
  | "abs_lower"
  | "obliques"
  // Ноги
  | "glute_max"
  | "glute_med"
  | "quad_rectus"
  | "quad_lateral"
  | "quad_medial"
  | "adductors"
  | "ham_biceps"
  | "ham_semi"
  | "calf_gastro"
  | "calf_soleus"
  | "tibialis";

export const MUSCLE_LABELS: Record<MuscleId, string> = {
  traps_upper: "Трапеция — верх",
  traps_mid: "Трапеция — середина",
  traps_low: "Трапеция — низ",
  rhomboids: "Ромбовидные",
  delt_front: "Дельта — передний пучок",
  delt_side: "Дельта — средний пучок",
  delt_rear: "Дельта — задний пучок",
  teres: "Большая круглая",
  chest_upper: "Грудь — верх (ключичная)",
  chest_mid: "Грудь — середина (грудинная)",
  chest_low: "Грудь — низ (рёберная)",
  serratus: "Передняя зубчатая",
  lats_upper: "Широчайшая — верх",
  lats_lower: "Широчайшая — низ",
  erector: "Разгибатели спины",
  biceps_long: "Бицепс — длинная головка",
  biceps_short: "Бицепс — короткая головка",
  brachialis: "Плечевая (брахиалис)",
  triceps_long: "Трицепс — длинная головка",
  triceps_lateral: "Трицепс — латеральная головка",
  triceps_medial: "Трицепс — медиальная головка",
  forearm_flexors: "Предплечье — сгибатели",
  forearm_extensors: "Предплечье — разгибатели",
  abs_upper: "Пресс — верх",
  abs_lower: "Пресс — низ",
  obliques: "Косые живота",
  glute_max: "Большая ягодичная",
  glute_med: "Средняя ягодичная",
  quad_rectus: "Квадрицепс — прямая",
  quad_lateral: "Квадрицепс — латеральная",
  quad_medial: "Квадрицепс — медиальная (капля)",
  adductors: "Приводящие (внутр. бедро)",
  ham_biceps: "Бицепс бедра",
  ham_semi: "Полусухожильная / полуперепончатая",
  calf_gastro: "Икроножная",
  calf_soleus: "Камбаловидная",
  tibialis: "Передняя большеберцовая",
};

export const ACTIVATION_COLOR: Record<ActivationLevel, string> = {
  primary: "#ef4444",
  secondary: "#f97316",
  stabilizer: "#eab308",
};

export const ACTIVATION_LABEL: Record<ActivationLevel, string> = {
  primary: "Целевая — основная нагрузка",
  secondary: "Помогает — работает заметно",
  stabilizer: "Стабилизатор — работает фоново",
};

export type ActivationMap = Partial<Record<MuscleId, ActivationLevel>>;

export function buildActivation(
  primary: MuscleId[],
  secondary: MuscleId[],
  stabilizer: MuscleId[]
): ActivationMap {
  const map: ActivationMap = {};
  for (const id of stabilizer) map[id] = "stabilizer";
  for (const id of secondary) map[id] = "secondary";
  for (const id of primary) map[id] = "primary";
  return map;
}
