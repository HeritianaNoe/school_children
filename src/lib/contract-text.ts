/**
 * Texte du contrat d'enseignement, partagé par la page (/teachers/[id]/contract) et par le PDF :
 * les deux affichent ainsi exactement les mêmes clauses. Modèle générique : à faire valider
 * par la direction / un juriste avant usage.
 */
export const SCHOOL_NAME = "École lumière";

export type ContractTextInput = {
  year: string;
  status: string;
  /** Valeurs déjà formatées pour l'affichage (le PDF et la page n'ont pas les mêmes contraintes de police) */
  rate: string;
  start: string;
  end: string;
  teacherName: string;
  email: string;
  phone: string | null;
};

export function contractText(d: ContractTextInput) {
  return {
    parties: [
      `L'établissement « ${SCHOOL_NAME} », représenté par sa Direction, ci-après désigné « l'Établissement », d'une part,`,
      `et ${d.teacherName}, adresse e-mail : ${d.email}${d.phone ? `, téléphone : ${d.phone}` : ""}, ci-après désigné(e) « l'Enseignant(e) », d'autre part,`,
    ],
    articles: [
      {
        title: "Article 1 - Objet",
        body: [
          `L'Établissement engage l'Enseignant(e) en qualité d'enseignant(e), au statut « ${d.status} », afin de dispenser les enseignements qui lui sont confiés (matières et classes) pendant l'année scolaire ${d.year}.`,
        ],
      },
      {
        title: "Article 2 - Durée et renouvellement",
        body: [
          `Le présent contrat prend effet le ${d.start} et prend fin le ${d.end}, date de fin de l'année scolaire.`,
          "Il est établi pour une seule année scolaire : un nouveau contrat est émis à chaque nouvelle année scolaire.",
        ],
      },
      {
        title: "Article 3 - Rémunération",
        body: [
          `L'Enseignant(e) est rémunéré(e) sur la base d'un taux horaire brut de ${d.rate}.`,
          "Sont rémunérées les heures effectivement enseignées, d'après les séances tenues et la présence enregistrée de l'Enseignant(e). Une séance non assurée n'est pas rémunérée.",
          "La rémunération est établie chaque mois sur une fiche de paie.",
        ],
      },
      {
        title: "Article 4 - Obligations de l'Enseignant(e)",
        body: [
          "L'Enseignant(e) assure ses séances avec assiduité et ponctualité, enregistre les présences des élèves et saisit les notes dans les délais, et respecte le règlement intérieur de l'Établissement.",
        ],
      },
      {
        title: "Article 5 - Résiliation",
        body: [
          "Chaque partie peut mettre fin au contrat par écrit, dans les conditions convenues entre les parties. Les heures déjà effectuées restent dues.",
        ],
      },
    ],
  };
}
