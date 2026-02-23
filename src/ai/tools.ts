// ---------------------------------------------------------------------------
// AI Tool Definitions — OpenAI function calling schemas for ViTrack Coach
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      required?: string[];
      properties: Record<string, unknown>;
    };
  };
}

export const AI_TOOLS: ToolDefinition[] = [
  // -----------------------------------------------------------------------
  // 1. log_meal — Registra un pasto
  // -----------------------------------------------------------------------
  {
    type: "function",
    function: {
      name: "log_meal",
      description:
        "Registra un pasto dell'utente. Usa questo tool quando l'utente dice cosa ha mangiato e hai tutti i dati necessari (alimenti + quantità). Per piatti composti, scomponi in ingredienti singoli.",
      parameters: {
        type: "object",
        required: ["items", "meal_type"],
        properties: {
          items: {
            type: "array",
            description: "Lista degli alimenti nel pasto",
            items: {
              type: "object",
              required: ["name", "name_en", "quantity_g"],
              properties: {
                name: {
                  type: "string",
                  description:
                    "Nome dell'alimento in italiano (es: 'petto di pollo', 'pasta')",
                },
                name_en: {
                  type: "string",
                  description:
                    "Nome dell'alimento in inglese per il lookup nutrizionale (es: 'chicken breast', 'pasta')",
                },
                quantity_g: {
                  type: "number",
                  description: "Quantità in grammi",
                },
                brand: {
                  type: "string",
                  description:
                    "Marca del prodotto se specificata (es: 'Müller', 'Barilla')",
                },
                is_cooked: {
                  type: "boolean",
                  description:
                    "true se il peso è riferito all'alimento cotto, false o omesso se crudo",
                },
              },
            },
          },
          meal_type: {
            type: "string",
            enum: ["colazione", "pranzo", "cena", "snack"],
            description: "Tipo di pasto",
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 2. log_workout — Registra un allenamento
  // -----------------------------------------------------------------------
  {
    type: "function",
    function: {
      name: "log_workout",
      description:
        "Registra un allenamento dell'utente. Usa quando l'utente descrive un workout completato.",
      parameters: {
        type: "object",
        required: ["description", "workout_type", "exercises"],
        properties: {
          description: {
            type: "string",
            description:
              "Descrizione breve dell'allenamento (es: 'Upper body push', 'Corsa al parco')",
          },
          workout_type: {
            type: "string",
            description:
              "Tipo di allenamento (es: 'forza', 'cardio', 'hiit', 'flessibilità', 'sport')",
          },
          duration_min: {
            type: "number",
            description: "Durata in minuti, se specificata",
          },
          exercises: {
            type: "array",
            description: "Lista degli esercizi svolti",
            items: {
              type: "object",
              required: ["name", "sets", "reps"],
              properties: {
                name: {
                  type: "string",
                  description: "Nome dell'esercizio (es: 'panca piana', 'squat')",
                },
                sets: {
                  type: "number",
                  description: "Numero di serie",
                },
                reps: {
                  type: "number",
                  description: "Numero di ripetizioni per serie",
                },
                weight_kg: {
                  type: "number",
                  description: "Peso utilizzato in kg, se applicabile",
                },
              },
            },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 3. log_water — Registra acqua
  // -----------------------------------------------------------------------
  {
    type: "function",
    function: {
      name: "log_water",
      description: "Registra assunzione di acqua.",
      parameters: {
        type: "object",
        required: ["amount_ml"],
        properties: {
          amount_ml: {
            type: "number",
            description: "Quantità di acqua in millilitri",
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 4. log_weight — Registra peso corporeo
  // -----------------------------------------------------------------------
  {
    type: "function",
    function: {
      name: "log_weight",
      description: "Registra il peso corporeo dell'utente.",
      parameters: {
        type: "object",
        required: ["weight_kg"],
        properties: {
          weight_kg: {
            type: "number",
            description: "Peso corporeo in kg",
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 5. search_food — Cerca info nutrizionali
  // -----------------------------------------------------------------------
  {
    type: "function",
    function: {
      name: "search_food",
      description:
        "Cerca informazioni nutrizionali di un alimento. Usa quando l'utente chiede 'quante calorie ha X?' o 'valori nutrizionali di X'. NON usare per registrare pasti — usa log_meal.",
      parameters: {
        type: "object",
        required: ["food_name", "food_name_en", "quantity_g"],
        properties: {
          food_name: {
            type: "string",
            description: "Nome dell'alimento in italiano",
          },
          food_name_en: {
            type: "string",
            description:
              "Nome dell'alimento in inglese per il lookup nutrizionale",
          },
          quantity_g: {
            type: "number",
            description: "Quantità in grammi per cui calcolare i valori",
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 6. get_daily_summary — Riepilogo giornata
  // -----------------------------------------------------------------------
  {
    type: "function",
    function: {
      name: "get_daily_summary",
      description:
        "Ottieni il riepilogo completo della giornata di oggi (pasti, allenamenti, macro, calorie). Usa quando l'utente chiede 'come va oggi?', 'riepilogo giornata', 'quante calorie mi restano?'",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },

  // -----------------------------------------------------------------------
  // 7. get_weekly_report — Report settimanale
  // -----------------------------------------------------------------------
  {
    type: "function",
    function: {
      name: "get_weekly_report",
      description:
        "Ottieni il report settimanale (media calorie, proteine, allenamenti, trend peso, aderenza). Usa per 'riepilogo settimana', 'come sto andando?', analisi trend.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },

  // -----------------------------------------------------------------------
  // 8. delete_meal — Elimina un pasto
  // -----------------------------------------------------------------------
  {
    type: "function",
    function: {
      name: "delete_meal",
      description:
        "Elimina un pasto registrato. Usa quando l'utente chiede di cancellare un pasto specifico.",
      parameters: {
        type: "object",
        required: ["meal_id"],
        properties: {
          meal_id: {
            type: "string",
            description: "ID del pasto da eliminare",
          },
        },
      },
    },
  },
];
