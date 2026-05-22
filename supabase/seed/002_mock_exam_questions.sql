-- ==============================================================
-- SunuPermis — Seed 002: Mock exam questions (110 questions)
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Idempotent: duplicate question_text is silently skipped
-- ==============================================================

-- Ensure idempotency constraint exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.exam_questions'::regclass
      AND conname = 'exam_questions_text_unique'
  ) THEN
    ALTER TABLE public.exam_questions
      ADD CONSTRAINT exam_questions_text_unique UNIQUE (question_text);
  END IF;
END $$;


-- ── 1. Code de la route (10) ─────────────────────────────────────────────────
INSERT INTO public.exam_questions
  (question_text, options, correct_answer, explanation, category, difficulty, is_active, learning_tip)
VALUES
  (
    'Quelle est la vitesse maximale autorisée en agglomération en l''absence de panneau ?',
    '["50 km/h", "60 km/h", "70 km/h", "30 km/h"]',
    '50 km/h',
    'En agglomération, la vitesse est limitée à 50 km/h par défaut, sauf indication contraire.',
    'Code de la route', 'easy', true,
    'Retenez : agglomération = 50, route = 80, autoroute = 130.'
  ),
  (
    'Que signifie une ligne blanche continue au centre de la chaussée ?',
    '["Dépassement interdit", "Dépassement autorisé", "Stationnement interdit", "Arrêt interdit"]',
    'Dépassement interdit',
    'Une ligne continue ne doit pas être franchie ni longée pour dépasser.',
    'Code de la route', 'easy', true,
    'Continue = interdit. Discontinue = autorisé si sécurité respectée.'
  ),
  (
    'Dans quel sens doit circuler un conducteur sur une route à double sens ?',
    '["À droite", "À gauche", "Au centre", "Au choix"]',
    'À droite',
    'En Afrique francophone, la circulation se fait à droite, comme en France.',
    'Code de la route', 'easy', true,
    'La règle de droite est fondamentale : chaque véhicule garde sa droite.'
  ),
  (
    'Qu''est-ce que le principe de la "priorité à droite" ?',
    '["Céder le passage à tout véhicule venant de votre droite", "Avoir la priorité sur les véhicules de droite", "Passer en premier sur un rond-point", "Toujours s''arrêter avant une intersection"]',
    'Céder le passage à tout véhicule venant de votre droite',
    'La priorité à droite s''applique aux intersections sans signalisation particulière.',
    'Code de la route', 'easy', true,
    'En l''absence de panneau, regardez toujours à droite avant de traverser.'
  ),
  (
    'Que doit faire un conducteur lorsqu''il croise une ambulance en intervention ?',
    '["Se rabattre à droite et s''arrêter si nécessaire", "Accélérer pour la laisser passer", "Continuer normalement", "Klaxonner pour la prévenir"]',
    'Se rabattre à droite et s''arrêter si nécessaire',
    'Les véhicules prioritaires (ambulance, pompiers, police) doivent toujours pouvoir passer.',
    'Code de la route', 'easy', true,
    'Dès que vous entendez la sirène, serrez à droite et ralentissez.'
  ),
  (
    'Quelle distance minimale de sécurité doit-on laisser derrière le véhicule qui précède à 80 km/h ?',
    '["Au moins 2 secondes (environ 45 m)", "10 mètres", "1 mètre par km/h", "50 cm par km/h"]',
    'Au moins 2 secondes (environ 45 m)',
    'La règle des 2 secondes garantit un temps de réaction suffisant pour freiner.',
    'Code de la route', 'medium', true,
    'Choisissez un repère fixe : si vous le dépassez avant 2 s, vous êtes trop proche.'
  ),
  (
    'Un conducteur peut-il conduire après avoir consommé de l''alcool ?',
    '["Non, si son taux est supérieur à 0,5 g/L de sang", "Oui, s''il se sent en état", "Oui, en dessous de 1 g/L", "Non, jamais même en dessous de la limite"]',
    'Non, si son taux est supérieur à 0,5 g/L de sang',
    'Le taux légal est de 0,5 g/L de sang (0,25 mg/L d''air expiré) dans la plupart des pays.',
    'Code de la route', 'medium', true,
    'Alcool et volant ne font pas bon ménage : préférez un conducteur sobre.'
  ),
  (
    'Quelle est la vitesse maximale autorisée sur une autoroute en conditions normales ?',
    '["130 km/h", "110 km/h", "150 km/h", "100 km/h"]',
    '130 km/h',
    'Sur autoroute, la limitation est fixée à 130 km/h par temps sec.',
    'Code de la route', 'easy', true,
    'Par temps de pluie, cette limite descend à 110 km/h.'
  ),
  (
    'Que signifie un triangle rouge sur un panneau de signalisation ?',
    '["Danger ou avertissement", "Obligation", "Interdiction", "Indication"]',
    'Danger ou avertissement',
    'Les panneaux triangulaires à bordure rouge signalent un danger à proximité.',
    'Code de la route', 'easy', true,
    'Triangle = danger, cercle rouge = interdiction, carré bleu = obligation.'
  ),
  (
    'Lorsqu''on tourne à gauche en ville, quelle est la règle de base ?',
    '["Céder le passage aux véhicules venant en sens inverse", "Accélérer pour couper la route", "Rester au centre de la chaussée", "Klaxonner avant de tourner"]',
    'Céder le passage aux véhicules venant en sens inverse',
    'Lors d''un virage à gauche, vous croisez le flux adverse : vous devez donc attendre.',
    'Code de la route', 'medium', true,
    'Regardez les deux sens avant de tourner à gauche : piétons et véhicules peuvent surgir.'
  ),

-- ── 2. Signalisation (10) ────────────────────────────────────────────────────
  (
    'Que signifie un panneau circulaire rouge avec une barre horizontale blanche ?',
    '["Sens interdit", "Stationnement interdit", "Arrêt interdit", "Zone de danger"]',
    'Sens interdit',
    'Ce panneau interdit l''entrée dans une voie à tous les véhicules venant de ce sens.',
    'Signalisation', 'easy', true,
    'C''est l''un des panneaux les plus importants : l''ignorer peut provoquer une collision frontale.'
  ),
  (
    'Que signifie le feu tricolore orange fixe ?',
    '["Préparez-vous à vous arrêter", "Accélérez", "Freinage d''urgence", "Vous pouvez passer"]',
    'Préparez-vous à vous arrêter',
    'Le feu orange signifie que le feu va passer au rouge : il faut ralentir et s''apprêter à s''arrêter.',
    'Signalisation', 'easy', true,
    'Ne jamais griller un orange "tardif" : c''est aussi dangereux qu''un feu rouge.'
  ),
  (
    'Un panneau "STOP" impose :',
    '["Un arrêt complet avant la ligne et la cession du passage", "Un simple ralentissement", "De klaxonner avant de passer", "De s''arrêter uniquement s''il y a des véhicules"]',
    'Un arrêt complet avant la ligne et la cession du passage',
    'Le Stop est absolu : l''arrêt doit être marqué même en l''absence de circulation.',
    'Signalisation', 'easy', true,
    'Arrêt = roues immobiles. Un simple ralentissement ne suffit pas.'
  ),
  (
    'Que représente un panneau triangulaire avec un enfant qui court ?',
    '["Passage d''écoliers ou de piétons", "Zone de jeux", "École à proximité", "Garderie"]',
    'Passage d''écoliers ou de piétons',
    'Ce panneau signale un passage de piétons, souvent près d''une école.',
    'Signalisation', 'easy', true,
    'Ralentissez et soyez prêts à céder le passage aux piétons dans cette zone.'
  ),
  (
    'Que signifie une flèche bleue au sol dans un couloir de circulation ?',
    '["Sens de circulation autorisé dans ce couloir", "Sens interdit", "Stationnement réservé", "Zone de livraison"]',
    'Sens de circulation autorisé dans ce couloir',
    'Les marquages au sol en bleu indiquent la direction à suivre pour ce couloir.',
    'Signalisation', 'medium', true,
    'Les couloirs de bus ou de voies réservées sont souvent marqués au sol.'
  ),
  (
    'Un panneau rectangulaire bleu avec un "P" blanc signifie :',
    '["Stationnement autorisé", "Parking interdit", "Zone payante uniquement", "Arrêt de bus"]',
    'Stationnement autorisé',
    'Le panneau bleu avec P indique une zone de stationnement autorisé.',
    'Signalisation', 'easy', true,
    'Vérifiez aussi les horaires indiqués sur le panneau complémentaire en dessous.'
  ),
  (
    'Que signifie un panneau circulaire bleu avec une flèche blanche pointant vers le haut ?',
    '["Circulation obligatoire dans cette direction", "Sens interdit", "Route à sens unique", "Voie rapide"]',
    'Circulation obligatoire dans cette direction',
    'Les panneaux circulaires bleus imposent une obligation de direction.',
    'Signalisation', 'medium', true,
    'Bleu + flèche = obligation. Rouge + barre = interdiction.'
  ),
  (
    'Que signifie un panneau avec un triangle rouge et un point d''exclamation ?',
    '["Danger non spécifié en avant", "Zone de travaux", "Virage dangereux", "Chaussée glissante"]',
    'Danger non spécifié en avant',
    'Ce panneau d''avertissement générique signale un danger particulier non figuré par un autre panneau.',
    'Signalisation', 'medium', true,
    'Réduisez votre vitesse et soyez particulièrement attentif à l''environnement.'
  ),
  (
    'Un feu rouge clignotant signifie :',
    '["Arrêt absolu obligatoire (passage à niveau ou danger immédiat)", "Ralentissez", "Passez avec précaution", "Feu hors service"]',
    'Arrêt absolu obligatoire (passage à niveau ou danger immédiat)',
    'Le rouge clignotant impose un arrêt absolu, notamment aux passages à niveau.',
    'Signalisation', 'medium', true,
    'Aux passages à niveau, un rouge clignotant annonce un train : ne jamais forcer le passage.'
  ),
  (
    'Que signifie un panneau octogonal rouge avec "CÉDEZ LE PASSAGE" ?',
    '["Vous devez laisser passer les autres véhicules avant d''avancer", "Arrêt complet obligatoire", "Priorité absolue", "Zone de péage"]',
    'Vous devez laisser passer les autres véhicules avant d''avancer',
    'Le "Cédez le passage" oblige à laisser passer les usagers qui ont la priorité.',
    'Signalisation', 'easy', true,
    'Différence avec le STOP : ici un arrêt n''est pas obligatoire s''il n''y a personne.'
  ),

-- ── 3. Priorités (10) ────────────────────────────────────────────────────────
  (
    'Qui est prioritaire sur un rond-point sans signalisation particulière ?',
    '["Les véhicules déjà engagés sur le rond-point", "Les véhicules qui entrent", "Le véhicule le plus lourd", "Le premier arrivé"]',
    'Les véhicules déjà engagés sur le rond-point',
    'Sur un rond-point, les véhicules circulant à l''intérieur ont la priorité sur ceux qui entrent.',
    'Priorités', 'easy', true,
    'Avant d''entrer sur un rond-point, regardez à gauche et cédez le passage.'
  ),
  (
    'Qui est prioritaire entre un véhicule sur une route principale et un véhicule sur une route secondaire ?',
    '["Le véhicule sur la route principale", "Le véhicule venant de droite", "Le véhicule le plus rapide", "Celui qui klaxonne en premier"]',
    'Le véhicule sur la route principale',
    'La route principale (panneau passage prioritaire) confère la priorité sur les routes secondaires.',
    'Priorités', 'easy', true,
    'Le panneau "passage prioritaire" (losange jaune) annonce que vous êtes sur la route principale.'
  ),
  (
    'À une intersection non réglementée, qui passe en premier ?',
    '["Le véhicule venant de la droite", "Le véhicule venant de la gauche", "Le premier arrivé", "Le plus gros véhicule"]',
    'Le véhicule venant de la droite',
    'En l''absence de signalisation, la règle de priorité à droite s''applique.',
    'Priorités', 'easy', true,
    'Habituez-vous à regarder à droite systématiquement avant chaque intersection.'
  ),
  (
    'Les piétons traversant sur un passage protégé ont-ils la priorité ?',
    '["Oui, le conducteur doit s''arrêter pour les laisser passer", "Non, les véhicules ont toujours priorité", "Oui, seulement si le feu est vert pour eux", "Non, sauf enfants et personnes âgées"]',
    'Oui, le conducteur doit s''arrêter pour les laisser passer',
    'Les piétons engagés sur un passage protégé ont la priorité absolue sur les véhicules.',
    'Priorités', 'easy', true,
    'Anticipez les passages piétons : ralentissez avant d''arriver dessus.'
  ),
  (
    'Qui est prioritaire entre un tramway et une voiture ?',
    '["Le tramway", "La voiture", "Celui qui est arrivé en premier", "Le plus rapide"]',
    'Le tramway',
    'Le tramway est un véhicule de transport en commun prioritaire sur les voitures.',
    'Priorités', 'medium', true,
    'Ne jamais couper la route à un tramway : il ne peut pas dévier de sa trajectoire.'
  ),
  (
    'Un véhicule de secours en intervention (sirène allumée) :',
    '["A la priorité absolue sur tous les autres usagers", "N''a aucune priorité particulière", "N''est prioritaire que sur les petits véhicules", "Est prioritaire uniquement sur autoroute"]',
    'A la priorité absolue sur tous les autres usagers',
    'Les véhicules d''urgence en mission (police, pompiers, ambulance) ont priorité absolue.',
    'Priorités', 'easy', true,
    'Dégagez le passage immédiatement : une seconde peut sauver une vie.'
  ),
  (
    'Sur une route avec un panneau "Cédez le passage", que doit faire le conducteur ?',
    '["Laisser passer les véhicules circulant sur la voie intersectée", "S''arrêter complètement", "Passer rapidement", "Klaxonner pour prévenir"]',
    'Laisser passer les véhicules circulant sur la voie intersectée',
    'Le "Cédez le passage" impose de céder la priorité sans nécessairement s''arrêter si la voie est libre.',
    'Priorités', 'easy', true,
    'Si la voie est dégagée, vous pouvez passer sans vous arrêter, mais avec prudence.'
  ),
  (
    'Entre une moto et une voiture à une intersection sans signalisation, qui est prioritaire ?',
    '["Celui venant de droite, quelle que soit la taille du véhicule", "La voiture toujours", "La moto toujours", "Le véhicule le plus lourd"]',
    'Celui venant de droite, quelle que soit la taille du véhicule',
    'La règle de priorité à droite s''applique indépendamment de la taille ou du type de véhicule.',
    'Priorités', 'medium', true,
    'La taille du véhicule ne confère aucune priorité : c''est la position qui compte.'
  ),
  (
    'Que faire si deux véhicules arrivent exactement en même temps à une intersection sans signalisation ?',
    '["Celui de droite passe en premier", "Ralentissez tous les deux et communiquez visuellement", "Le plus gros passe en premier", "Ni l''un ni l''autre ne doit passer"]',
    'Celui de droite passe en premier',
    'Même en arrivant simultanément, la règle de priorité à droite s''applique.',
    'Priorités', 'medium', true,
    'En cas d''incertitude, signalez votre intention et attendez confirmation visuelle.'
  ),
  (
    'Dans une voie rétrécie, quel véhicule doit s''effacer ?',
    '["Celui dont le passage est le moins aisé (souvent le plus grand)", "Toujours le véhicule venant en sens inverse", "Toujours le plus petit", "Celui qui roule le plus vite"]',
    'Celui dont le passage est le moins aisé (souvent le plus grand)',
    'La courtoisie et la logique imposent que le véhicule ayant le plus de marge cède le passage.',
    'Priorités', 'medium', true,
    'Sur une pente, le véhicule montant a généralement la priorité.'
  ),

-- ── 4. Sécurité routière (10) ────────────────────────────────────────────────
  (
    'Pourquoi la ceinture de sécurité est-elle obligatoire ?',
    '["Elle réduit considérablement les risques de blessures graves en cas d''accident", "Pour éviter les amendes uniquement", "Elle empêche le vol du véhicule", "Pour satisfaire à l''esthétique"]',
    'Elle réduit considérablement les risques de blessures graves en cas d''accident',
    'La ceinture de sécurité réduit de 50 % le risque de décès en cas d''accident grave.',
    'Sécurité routière', 'easy', true,
    'Attachez votre ceinture avant même de démarrer : c''est un réflexe vital.'
  ),
  (
    'Quel est l''effet de la fatigue sur la conduite ?',
    '["Elle allonge le temps de réaction et peut provoquer un endormissement", "Elle améliore la concentration", "Elle n''a aucun effet démontré", "Elle réduit la vitesse naturellement"]',
    'Elle allonge le temps de réaction et peut provoquer un endormissement',
    'La fatigue est l''une des premières causes d''accident mortel sur autoroute.',
    'Sécurité routière', 'easy', true,
    'Faites une pause toutes les 2 heures sur trajet long, ou dès les premiers signes de somnolence.'
  ),
  (
    'Que faire en cas de crevaison soudaine à grande vitesse ?',
    '["Tenir fermement le volant, ralentir progressivement sans freiner brutalement et s''arrêter sur le côté", "Freiner brutalement", "Accélérer pour contrôler la direction", "Couper le moteur immédiatement"]',
    'Tenir fermement le volant, ralentir progressivement sans freiner brutalement et s''arrêter sur le côté',
    'Un freinage brusque lors d''une crevaison peut faire perdre le contrôle du véhicule.',
    'Sécurité routière', 'medium', true,
    'Gardez votre calme et laissez la voiture ralentir en relâchant l''accélérateur.'
  ),
  (
    'Quand doit-on utiliser les feux de détresse (warning) ?',
    '["En cas de panne, accident ou danger immédiat pour alerter les autres usagers", "Pour remercier un autre conducteur", "Quand on cherche un stationnement", "Lors de pluie intense"]',
    'En cas de panne, accident ou danger immédiat pour alerter les autres usagers',
    'Les feux de détresse signalent une situation d''urgence et ne remplacent pas le triangle.',
    'Sécurité routière', 'easy', true,
    'Placez également un triangle de signalisation à au moins 30 m derrière le véhicule.'
  ),
  (
    'Quel impact a l''usage du téléphone en conduisant ?',
    '["Il multiplie par 4 le risque d''accident", "Il n''a aucun impact si on utilise le kit mains libres", "Il est uniquement dangereux la nuit", "Il augmente la vigilance"]',
    'Il multiplie par 4 le risque d''accident',
    'Le téléphone au volant détourne l''attention visuelle, mentale et physique du conducteur.',
    'Sécurité routière', 'easy', true,
    'Même avec un kit mains libres, la conversation détourne une partie de votre attention.'
  ),
  (
    'Comment vérifier la pression de vos pneus ?',
    '["Au gonfleur de station-service, à froid, selon les préconisations du constructeur", "À chaud après un long trajet", "À vue d''œil uniquement", "Tous les 2 ans"]',
    'Au gonfleur de station-service, à froid, selon les préconisations du constructeur',
    'La pression correcte améliore l''adhérence, réduit la consommation et évite l''éclatement.',
    'Sécurité routière', 'medium', true,
    'Vérifiez la pression une fois par mois et avant tout long trajet.'
  ),
  (
    'Que faire si votre voiture prend feu lors d''un trajet ?',
    '["S''arrêter, couper le moteur, évacuer tous les passagers et appeler les secours", "Accélérer pour atteindre la station la plus proche", "Ouvrir le capot immédiatement", "Continuer à rouler pour éteindre les flammes"]',
    'S''arrêter, couper le moteur, évacuer tous les passagers et appeler les secours',
    'Un incendie de véhicule peut évoluer très rapidement : l''évacuation prime sur tout.',
    'Sécurité routière', 'medium', true,
    'N''essayez pas de récupérer vos affaires : la vie des passagers est la seule priorité.'
  ),
  (
    'Le port du casque est-il obligatoire pour les motocyclistes ?',
    '["Oui, pour le conducteur et le passager", "Seulement pour le conducteur", "Seulement en ville", "Non, c''est facultatif"]',
    'Oui, pour le conducteur et le passager',
    'Le casque est obligatoire pour tous les occupants d''une moto, même à faible vitesse.',
    'Sécurité routière', 'easy', true,
    'Un casque homologué doit être attaché correctement pour être efficace.'
  ),
  (
    'Quand est-il conseillé de vérifier l''état de ses freins ?',
    '["Régulièrement lors des entretiens et dès que vous ressentez une anomalie", "Uniquement au contrôle technique", "Jamais si la voiture est neuve", "Tous les 5 ans"]',
    'Régulièrement lors des entretiens et dès que vous ressentez une anomalie',
    'Des freins défaillants sont l''une des causes principales d''accidents graves.',
    'Sécurité routière', 'easy', true,
    'Un bruit de grincement ou une pédale molle sont des signes à ne pas ignorer.'
  ),
  (
    'Quel est le risque principal lors de l''utilisation des phares à pleine puissance (pleins phares) face à un autre conducteur ?',
    '["Éblouissement du conducteur en face pouvant provoquer un accident", "Aucun risque particulier", "Consommation accrue de carburant", "Décharge de la batterie"]',
    'Éblouissement du conducteur en face pouvant provoquer un accident',
    'Les pleins phares aveuglent temporairement le conducteur en face, ce qui est très dangereux.',
    'Sécurité routière', 'easy', true,
    'Basculez en feux de croisement (codes) dès qu''un véhicule arrive en sens inverse.'
  ),

-- ── 5. Infractions (10) ──────────────────────────────────────────────────────
  (
    'Qu''est-ce qu''un excès de vitesse ?',
    '["Rouler au-delà de la vitesse maximale autorisée sur un tronçon donné", "Rouler trop lentement", "Freiner brusquement", "Changer de file rapidement"]',
    'Rouler au-delà de la vitesse maximale autorisée sur un tronçon donné',
    'L''excès de vitesse est l''une des premières infractions au code de la route.',
    'Infractions', 'easy', true,
    'La vitesse doit toujours être adaptée aux conditions de la route, pas juste aux panneaux.'
  ),
  (
    'Conduire sous l''influence de l''alcool au-dessus de la limite légale est :',
    '["Un délit passible d''amende, retrait de permis et emprisonnement", "Une infraction mineure", "Autorisé entre adultes consentants", "Seulement interdit sur autoroute"]',
    'Un délit passible d''amende, retrait de permis et emprisonnement',
    'La conduite en état d''ivresse est un délit grave dans tous les pays.',
    'Infractions', 'easy', true,
    'Désignez toujours un conducteur sobre avant une soirée où l''alcool est présent.'
  ),
  (
    'Que risque-t-on à griller un feu rouge ?',
    '["Une amende, un retrait de points et un risque d''accident élevé", "Rien si la route est libre", "Seulement une amende légère", "Un simple avertissement"]',
    'Une amende, un retrait de points et un risque d''accident élevé',
    'Le non-respect d''un feu rouge est l''une des principales causes d''accidents en intersection.',
    'Infractions', 'easy', true,
    'Un feu rouge doit toujours être respecté, même si la voie paraît libre.'
  ),
  (
    'Qu''est-ce que le délit de fuite après un accident ?',
    '["Quitter les lieux d''un accident sans s''identifier ni porter secours", "Partir rapidement après un accrochage mineur", "Conduire vite après un accident", "Refuser de payer les réparations"]',
    'Quitter les lieux d''un accident sans s''identifier ni porter secours',
    'Le délit de fuite est sanctionné pénalement, même si vous n''êtes pas responsable de l''accident.',
    'Infractions', 'medium', true,
    'En cas d''accident, restez sur place, appelez les secours et échangez vos coordonnées.'
  ),
  (
    'Stationner sur un emplacement réservé aux personnes handicapées sans y avoir droit est :',
    '["Une infraction sanctionnée par une forte amende et le risque de fourrière", "Autorisé quelques minutes", "Seulement interdit la nuit", "Une infraction mineure"]',
    'Une infraction sanctionnée par une forte amende et le risque de fourrière',
    'Ces places sont réservées aux détenteurs d''une carte de stationnement pour personnes handicapées.',
    'Infractions', 'easy', true,
    'Ces places sont essentielles pour les personnes à mobilité réduite : ne les occupez jamais.'
  ),
  (
    'Utiliser son téléphone portable à la main en conduisant est :',
    '["Interdit et passible d''une amende avec retrait de points", "Autorisé à l''arrêt au feu rouge", "Permis si l''appel dure moins d''une minute", "Seulement interdit sur autoroute"]',
    'Interdit et passible d''une amende avec retrait de points',
    'L''utilisation du téléphone en main est interdite, même à l''arrêt au feu rouge.',
    'Infractions', 'easy', true,
    'Garez-vous sur le côté si vous devez absolument répondre à un appel important.'
  ),
  (
    'Qu''est-ce que la conduite sans assurance ?',
    '["Un délit grave entraînant saisie du véhicule, amende élevée et responsabilité financière totale", "Une infraction légère", "Autorisé pour un court trajet", "Seulement interdit pour les étrangers"]',
    'Un délit grave entraînant saisie du véhicule, amende élevée et responsabilité financière totale',
    'Conduire sans assurance est illégal et expose à des sanctions pénales et financières sévères.',
    'Infractions', 'medium', true,
    'L''assurance au tiers minimum est obligatoire pour tout véhicule circulant sur la voie publique.'
  ),
  (
    'Faire une marche arrière sur une autoroute est :',
    '["Absolument interdit et très dangereux", "Autorisé en cas de panne", "Toléré si la sortie est proche", "Permis avec les feux de détresse allumés"]',
    'Absolument interdit et très dangereux',
    'La marche arrière sur autoroute est interdite et expose à des risques d''accident mortels.',
    'Infractions', 'medium', true,
    'Si vous ratez une sortie, continuez jusqu''à la suivante : ne jamais faire demi-tour.'
  ),
  (
    'Klaxonner de manière excessive ou inutile en agglomération est :',
    '["Interdit sauf en cas de danger immédiat", "Autorisé pour signaler son passage", "Obligatoire aux intersections", "Toléré la nuit"]',
    'Interdit sauf en cas de danger immédiat',
    'En agglomération, l''usage du klaxon est réservé aux situations de danger immédiat.',
    'Infractions', 'easy', true,
    'Le klaxon est un signal d''alerte, pas de salutation ou d''impatience.'
  ),
  (
    'Ne pas céder le passage à une ambulance en intervention est :',
    '["Une infraction pouvant être sanctionnée pénalement", "Acceptable si on est pressé", "Toléré en dehors des heures de pointe", "Aucune sanction prévue"]',
    'Une infraction pouvant être sanctionnée pénalement',
    'Gêner un véhicule d''urgence en mission constitue une infraction grave.',
    'Infractions', 'medium', true,
    'La priorité des véhicules d''urgence n''est pas une option : c''est une obligation légale.'
  ),

-- ── 6. Conduite pratique (10) ────────────────────────────────────────────────
  (
    'Comment effectuer correctement un dépassement ?',
    '["S''assurer que la visibilité est suffisante, mettre le clignotant, dépasser rapidement et se rabattre", "Dépasser par la droite", "Dépasser en klaxonnant", "Dépasser sans signaler si la route est large"]',
    'S''assurer que la visibilité est suffisante, mettre le clignotant, dépasser rapidement et se rabattre',
    'Un dépassement ne peut se faire que si la voie d''en face est libre sur une distance suffisante.',
    'Conduite pratique', 'medium', true,
    'Anticipez la distance nécessaire : à 90 km/h, un dépassement peut nécessiter 500 m.'
  ),
  (
    'Qu''est-ce que le freinage d''urgence ABS ?',
    '["Un système qui évite le blocage des roues lors d''un freinage intense", "Un frein supplémentaire", "Un frein automatique à l''arrêt", "Un système de freinage arrière uniquement"]',
    'Un système qui évite le blocage des roues lors d''un freinage intense',
    'L''ABS permet de conserver la direction du véhicule pendant un freinage d''urgence.',
    'Conduite pratique', 'medium', true,
    'Avec l''ABS, maintenez la pédale enfoncée fermement : ne pompez pas comme sur les anciens véhicules.'
  ),
  (
    'Comment aborder un virage dangereux ?',
    '["Réduire la vitesse avant le virage, ne pas freiner dans le virage", "Accélérer dans le virage pour stabiliser", "Freiner au milieu du virage", "Couper la ligne blanche"]',
    'Réduire la vitesse avant le virage, ne pas freiner dans le virage',
    'Freiner dans un virage peut provoquer une perte de contrôle ou un tête-à-queue.',
    'Conduite pratique', 'medium', true,
    '"Ralentir avant, accélérer après" : c''est la règle d''or du virage.'
  ),
  (
    'Qu''est-ce que l''aquaplaning ?',
    '["La perte de contact des pneus avec la route en raison d''une fine couche d''eau", "Une technique de freinage en pluie", "Un type de route glissante", "La condensation sur le pare-brise"]',
    'La perte de contact des pneus avec la route en raison d''une fine couche d''eau',
    'L''aquaplaning survient lorsqu''une couche d''eau s''interpose entre les pneus et la chaussée.',
    'Conduite pratique', 'medium', true,
    'En cas d''aquaplaning : ne brusquez rien, relâchez l''accélérateur progressivement.'
  ),
  (
    'Comment se garer en côte montante sans bordure de trottoir ?',
    '["Roues braquées à droite (vers le bas-côté), moteur coupé, frein à main serré", "Roues à gauche", "Roues droites", "Aucun réglage nécessaire"]',
    'Roues braquées à droite (vers le bas-côté), moteur coupé, frein à main serré',
    'En côte sans bordure, braquer les roues vers le bas-côté limite la progression en cas de défaillance du frein.',
    'Conduite pratique', 'medium', true,
    'En côte avec bordure : roues vers la gauche. Sans bordure : roues vers la droite.'
  ),
  (
    'Qu''est-ce que la distance de freinage ?',
    '["La distance parcourue entre l''appui sur la pédale et l''arrêt complet du véhicule", "La distance de sécurité", "La longueur des traces de freinage", "La distance entre deux feux rouges"]',
    'La distance parcourue entre l''appui sur la pédale et l''arrêt complet du véhicule',
    'La distance de freinage dépend de la vitesse, de l''état des freins et du revêtement.',
    'Conduite pratique', 'medium', true,
    'À 50 km/h, la distance de freinage est d''environ 14 m (hors temps de réaction).'
  ),
  (
    'Comment adapter sa conduite sur route mouillée ?',
    '["Réduire la vitesse, augmenter la distance de sécurité et éviter les freinages brusques", "Rouler plus vite pour éviter l''eau", "Freiner plus fort qu''habituellement", "Allumer uniquement les feux de recul"]',
    'Réduire la vitesse, augmenter la distance de sécurité et éviter les freinages brusques',
    'Sur route mouillée, l''adhérence est réduite et la distance de freinage augmentée.',
    'Conduite pratique', 'easy', true,
    'Par temps de pluie, doublez mentalement vos distances de sécurité.'
  ),
  (
    'Comment effectuer un créneau (stationnement parallèle) ?',
    '["Se placer à côté du véhicule de devant, reculer en braquant vers le trottoir, puis redresser", "Rentrer directement en marche avant", "Se placer à 2 m du véhicule et rentrer en ligne droite", "Demander de l''aide systématiquement"]',
    'Se placer à côté du véhicule de devant, reculer en braquant vers le trottoir, puis redresser',
    'Le créneau est une manœuvre de base qui nécessite de la pratique et une bonne estimation des distances.',
    'Conduite pratique', 'medium', true,
    'Exercez-vous dans un parking vide avant de tenter un créneau en situation réelle.'
  ),
  (
    'Quand faut-il allumer ses phares de croisement (codes) ?',
    '["À partir de 30 minutes après le coucher du soleil, en tunnel et par mauvaise visibilité", "Seulement la nuit complète", "Uniquement sur autoroute", "Seulement quand d''autres conducteurs le font"]',
    'À partir de 30 minutes après le coucher du soleil, en tunnel et par mauvaise visibilité',
    'Les feux de croisement améliorent votre visibilité et permettent aux autres de vous voir.',
    'Conduite pratique', 'easy', true,
    'En cas de doute, allumez vos phares : voir et être vu est toujours bénéfique.'
  ),
  (
    'Qu''est-ce que le point mort sur une boîte manuelle ?',
    '["La position du levier où aucun rapport n''est enclenché", "Le frein de stationnement", "La position de démarrage", "Le régime moteur le plus bas"]',
    'La position du levier où aucun rapport n''est enclenché',
    'Au point mort, le moteur est découplé des roues, le véhicule peut rouler librement.',
    'Conduite pratique', 'easy', true,
    'Ne roulez jamais longtemps au point mort : vous perdez le contrôle du moteur.'
  ),

-- ── 7. Mécanique de base (10) ────────────────────────────────────────────────
  (
    'Que signifie le témoin lumineux en forme de batterie sur le tableau de bord ?',
    '["Problème de charge de la batterie ou de l''alternateur", "Batterie pleine", "Niveau d''huile bas", "Voyant de contrôle normal"]',
    'Problème de charge de la batterie ou de l''alternateur',
    'Ce voyant indique que la batterie ne se charge pas correctement, ce qui peut laisser le véhicule en panne.',
    'Mécanique de base', 'medium', true,
    'Si ce voyant s''allume en roulant, rejoignez un garage le plus tôt possible.'
  ),
  (
    'À quoi sert l''huile moteur ?',
    '["Lubrifier les pièces mobiles du moteur pour éviter l''usure et la surchauffe", "Refroidir le moteur uniquement", "Alimenter le moteur en carburant", "Nettoyer les filtres"]',
    'Lubrifier les pièces mobiles du moteur pour éviter l''usure et la surchauffe',
    'Sans huile, les pièces métalliques frotteraient, s''échauffant jusqu''à la destruction du moteur.',
    'Mécanique de base', 'easy', true,
    'Vérifiez le niveau d''huile avec la jauge une fois par mois ou avant un long trajet.'
  ),
  (
    'Que faire si le voyant de température du moteur est au maximum (rouge) ?',
    '["S''arrêter immédiatement, couper le moteur et attendre qu''il refroidisse", "Continuer en roulant lentement", "Accélérer pour refroidir plus vite", "Verser de l''eau froide sur le moteur"]',
    'S''arrêter immédiatement, couper le moteur et attendre qu''il refroidisse',
    'Un moteur en surchauffe peut être irrémédiablement endommagé en quelques minutes.',
    'Mécanique de base', 'medium', true,
    'N''ouvrez jamais le bouchon de radiateur quand le moteur est chaud : risque de brûlures.'
  ),
  (
    'À quoi sert le liquide de frein ?',
    '["Transmettre la pression de votre pédale aux étriers de frein", "Refroidir les freins", "Lubrifier les disques", "Alimenter le frein à main"]',
    'Transmettre la pression de votre pédale aux étriers de frein',
    'Le liquide de frein est hydraulique : il transmet la force mécanique de votre pied aux roues.',
    'Mécanique de base', 'medium', true,
    'Un liquide de frein contaminé ou bas peut provoquer une perte de freinage progressive.'
  ),
  (
    'Que signifie le voyant en forme d''ampoule sur le tableau de bord ?',
    '["Un feu ou une ampoule extérieure est grillée", "Le carburant est bas", "Le moteur a un problème", "La climatisation est défaillante"]',
    'Un feu ou une ampoule extérieure est grillée',
    'Ce voyant signale qu''un feu de votre véhicule est défaillant et doit être remplacé rapidement.',
    'Mécanique de base', 'easy', true,
    'Un feu grillé est une infraction au code de la route en plus d''un risque pour la sécurité.'
  ),
  (
    'À quoi sert le radiateur d''un véhicule ?',
    '["Refroidir le moteur en dissipant la chaleur produite par la combustion", "Chauffer l''habitacle uniquement", "Filtrer l''air aspiré par le moteur", "Alimenter le moteur en eau"]',
    'Refroidir le moteur en dissipant la chaleur produite par la combustion',
    'Le radiateur dissipe la chaleur du liquide de refroidissement qui circule dans le moteur.',
    'Mécanique de base', 'easy', true,
    'Vérifiez le niveau de liquide de refroidissement à froid, jamais moteur chaud.'
  ),
  (
    'Quand faut-il changer les essuie-glaces ?',
    '["Dès qu''ils laissent des traces ou striures sur le pare-brise", "Tous les 10 ans", "Uniquement s''ils s''arrêtent de fonctionner", "Seulement en saison des pluies"]',
    'Dès qu''ils laissent des traces ou striures sur le pare-brise',
    'Des essuie-glaces usés compromettent gravement la visibilité par temps de pluie.',
    'Mécanique de base', 'easy', true,
    'Remplacez les essuie-glaces en moyenne tous les 1 à 2 ans.'
  ),
  (
    'Que signifie le sigle "ABS" ?',
    '["Système de freinage antiblocage (Anti-lock Braking System)", "Système d''accélération automatique", "Frein de sécurité supplémentaire", "Amortisseur de bruit de frein"]',
    'Système de freinage antiblocage (Anti-lock Braking System)',
    'L''ABS empêche le blocage des roues lors d''un freinage intense pour conserver la directivité.',
    'Mécanique de base', 'easy', true,
    'Avec l''ABS, maintenez une pression ferme et continue sur la pédale de frein.'
  ),
  (
    'Quel est l''indice de la bonne pression des pneus pour votre véhicule ?',
    '["Il est indiqué sur l''étiquette dans la portière ou dans le manuel du propriétaire", "Sur le flanc du pneu uniquement", "Toujours 2 bars pour tous les véhicules", "Sur le capot du véhicule"]',
    'Il est indiqué sur l''étiquette dans la portière ou dans le manuel du propriétaire',
    'La pression recommandée varie selon le véhicule et la charge transportée.',
    'Mécanique de base', 'easy', true,
    'La pression sur le flanc du pneu est la pression maximale, pas la pression recommandée.'
  ),
  (
    'Pourquoi ne faut-il pas rouler avec des pneus lisses ?',
    '["Ils n''évacuent plus l''eau et réduisent dangereusement l''adhérence, surtout par temps de pluie", "Ils consomment plus d''essence", "Ils abîment la route", "Ils font du bruit uniquement"]',
    'Ils n''évacuent plus l''eau et réduisent dangereusement l''adhérence, surtout par temps de pluie',
    'Les sculptures des pneus servent à évacuer l''eau entre le pneu et la route.',
    'Mécanique de base', 'medium', true,
    'La profondeur légale minimale des sculptures est généralement de 1,6 mm.'
  ),

-- ── 8. Piétons et motos (10) ─────────────────────────────────────────────────
  (
    'Quelle est la distance minimale de dépassement d''un cycliste en agglomération ?',
    '["1 mètre minimum", "50 cm", "2 mètres", "Aucune règle spécifique"]',
    '1 mètre minimum',
    'Le dépassement d''un cycliste doit se faire avec une distance latérale d''au moins 1 mètre en ville.',
    'Piétons et motos', 'medium', true,
    'Hors agglomération, la distance minimale est de 1,5 mètre.'
  ),
  (
    'Un piéton traverse en dehors d''un passage protégé. Que faire ?',
    '["Ralentir et lui céder le passage s''il est déjà engagé", "Klaxonner pour l''avertir et continuer", "Freiner brusquement", "L''ignorer car il n''est pas prioritaire"]',
    'Ralentir et lui céder le passage s''il est déjà engagé',
    'Un piéton engagé sur la chaussée, même hors passage protégé, crée un danger que le conducteur doit gérer.',
    'Piétons et motos', 'medium', true,
    'Anticipez les comportements imprévisibles des piétons, surtout aux abords des marchés.'
  ),
  (
    'Les motocyclistes peuvent-ils circuler entre les files de voitures (interfile) ?',
    '["Cela dépend de la réglementation locale ; vérifiez le code de la route de votre pays", "Oui, toujours autorisé", "Non, jamais autorisé nulle part", "Seulement la nuit"]',
    'Cela dépend de la réglementation locale ; vérifiez le code de la route de votre pays',
    'L''interfile est autorisée dans certains pays et sous conditions, interdite dans d''autres.',
    'Piétons et motos', 'medium', true,
    'En l''absence de règle claire, la prudence reste la meilleure approche pour les motards.'
  ),
  (
    'Pourquoi les angle morts sont-ils particulièrement dangereux pour les motos ?',
    '["Leur petite taille les rend invisibles dans les rétroviseurs des voitures", "Elles sont trop rapides", "Elles n''ont pas de feux", "Elles sont silencieuses"]',
    'Leur petite taille les rend invisibles dans les rétroviseurs des voitures',
    'Les motos peuvent disparaître dans l''angle mort d''un véhicule, notamment au moment d''un changement de voie.',
    'Piétons et motos', 'easy', true,
    'Tournez physiquement la tête pour vérifier l''angle mort avant tout changement de direction.'
  ),
  (
    'Que faire lorsqu''un piéton s''apprête à traverser sur un passage protégé ?',
    '["S''arrêter et lui céder le passage", "Klaxonner pour le prévenir de votre présence", "Accélérer pour passer avant lui", "Passer lentement sans s''arrêter"]',
    'S''arrêter et lui céder le passage',
    'Le piéton engagé ou s''apprêtant à traverser sur un passage protégé doit toujours pouvoir passer.',
    'Piétons et motos', 'easy', true,
    'Anticipez : réduisez votre vitesse dès que vous approchez d''un passage piétons.'
  ),
  (
    'Quel équipement de protection est recommandé pour un motocycliste en plus du casque ?',
    '["Blouson, gants, bottes et pantalon renforcés", "Aucun équipement supplémentaire n''est nécessaire", "Simplement des lunettes de soleil", "Un gilet réfléchissant uniquement"]',
    'Blouson, gants, bottes et pantalon renforcés',
    'En cas de chute, ces équipements protègent des abrasions, fractures et traumatismes.',
    'Piétons et motos', 'easy', true,
    'Les EPI (Équipements de Protection Individuelle) peuvent faire la différence entre une égratignure et une blessure grave.'
  ),
  (
    'Que doit faire un conducteur lorsqu''il aperçoit un enfant courir vers la chaussée ?',
    '["Freiner immédiatement et être prêt à s''arrêter", "Klaxonner et continuer", "Dévier légèrement sa trajectoire", "Accélérer pour passer avant l''enfant"]',
    'Freiner immédiatement et être prêt à s''arrêter',
    'Les enfants ont des réactions imprévisibles : leur comportement ne peut pas être anticipé.',
    'Piétons et motos', 'easy', true,
    'Aux abords des écoles et des parcs, ralentissez même en l''absence de signalisation.'
  ),
  (
    'Comment un piéton doit-il se comporter sur une route sans trottoir ?',
    '["Marcher face à la circulation et serré sur le côté gauche de la route", "Marcher dans le même sens que les véhicules", "Marcher au centre de la chaussée", "Courir pour traverser rapidement"]',
    'Marcher face à la circulation et serré sur le côté gauche de la route',
    'Marcher face aux véhicules permet au piéton de voir les voitures arriver et de réagir.',
    'Piétons et motos', 'medium', true,
    'Cette règle s''applique uniquement quand il n''y a pas de trottoir disponible.'
  ),
  (
    'Pourquoi une moto est-elle plus difficile à voir qu''une voiture pour les autres conducteurs ?',
    '["Son emprise visuelle est beaucoup plus réduite qu''un véhicule quatre roues", "Elle roule trop vite", "Elle n''a pas de clignotants", "Elle est silencieuse"]',
    'Son emprise visuelle est beaucoup plus réduite qu''un véhicule quatre roues',
    'La surface visible d''une moto est bien inférieure à celle d''une voiture, ce qui complique sa détection.',
    'Piétons et motos', 'easy', true,
    'Portez des vêtements voyants et utilisez vos feux même de jour pour être plus visible.'
  ),
  (
    'Lors d''un dépassement d''un cycliste par mauvais temps, que faut-il faire en plus ?',
    '["Augmenter la distance latérale de dépassement car le cycliste peut être déstabilisé", "Klaxonner avant de dépasser", "Passer à la même vitesse qu''habituellement", "Allumer les pleins phares"]',
    'Augmenter la distance latérale de dépassement car le cycliste peut être déstabilisé',
    'Le vent, la pluie et les rafales peuvent faire dévier un cycliste : gardez plus d''espace.',
    'Piétons et motos', 'medium', true,
    'Par grand vent latéral, les cyclistes et motards peuvent dévier de plusieurs décimètres.'
  ),

-- ── 9. Stationnement (10) ────────────────────────────────────────────────────
  (
    'Peut-on se garer devant une entrée de garage privé ?',
    '["Non, c''est interdit même brièvement", "Oui, si c''est pour moins de 5 minutes", "Oui, la nuit uniquement", "Oui si le propriétaire est absent"]',
    'Non, c''est interdit même brièvement',
    'Stationner devant un accès privatif est interdit car cela empêche le propriétaire d''entrer ou de sortir.',
    'Stationnement', 'easy', true,
    'Un simple arrêt le temps de déposer quelqu''un peut déjà être verbalisé.'
  ),
  (
    'Quelle est la différence entre un arrêt et un stationnement ?',
    '["L''arrêt est bref et le conducteur reste à bord ; le stationnement est plus long ou le conducteur s''éloigne", "Il n''y a aucune différence", "L''arrêt est interdit partout", "Le stationnement est toujours payant"]',
    'L''arrêt est bref et le conducteur reste à bord ; le stationnement est plus long ou le conducteur s''éloigne',
    'Cette distinction est cruciale pour interpréter correctement les panneaux de signalisation.',
    'Stationnement', 'easy', true,
    'Un "arrêt interdit" est plus restrictif qu''un "stationnement interdit".'
  ),
  (
    'Est-il autorisé de se garer sur un trottoir ?',
    '["Non, c''est interdit et dangereux pour les piétons", "Oui si la rue est large", "Oui pour les livraisons", "Oui si on laisse 1 m de passage"]',
    'Non, c''est interdit et dangereux pour les piétons',
    'Le trottoir est réservé aux piétons ; stationner dessus les oblige à descendre sur la chaussée.',
    'Stationnement', 'easy', true,
    'Les personnes à mobilité réduite et les poussettes sont particulièrement pénalisées par les véhicules sur trottoir.'
  ),
  (
    'Que signifie un panneau "Stationnement interdit" ?',
    '["Il est interdit de laisser son véhicule garé sans surveillance", "L''arrêt est également interdit", "On peut s''arrêter brièvement", "Seulement interdit les jours ouvrés"]',
    'Il est interdit de laisser son véhicule garé sans surveillance',
    'L''interdiction de stationnement n''interdit pas nécessairement l''arrêt bref avec conducteur à bord.',
    'Stationnement', 'medium', true,
    'Un panneau "Arrêt et stationnement interdits" interdit toute immobilisation du véhicule.'
  ),
  (
    'À quelle distance minimale d''un feu tricolore est-il interdit de stationner ?',
    '["Au moins 5 mètres", "10 mètres", "2 mètres", "Aucune restriction spécifique"]',
    'Au moins 5 mètres',
    'Stationner trop près d''un feu réduit la visibilité et gêne la circulation.',
    'Stationnement', 'medium', true,
    'Cette distance peut varier selon les pays : vérifiez le code de la route local.'
  ),
  (
    'Peut-on se garer en double file ?',
    '["Non, sauf exception très brève pour une livraison urgente avec feux de détresse", "Oui si le conducteur reste dans la voiture", "Oui si la rue est large", "Oui la nuit"]',
    'Non, sauf exception très brève pour une livraison urgente avec feux de détresse',
    'La double file bloque la circulation et est une infraction sanctionnée dans la plupart des pays.',
    'Stationnement', 'easy', true,
    'La double file peut bloquer un bus entier et des dizaines de passagers.'
  ),
  (
    'Que faire si l''on ne trouve pas de place de stationnement autorisée ?',
    '["Chercher un parking, une zone autorisée ou attendre qu''une place se libère", "Se garer n''importe où si c''est pour peu de temps", "Stationner sur la voie de bus", "Garer sur le trottoir"]',
    'Chercher un parking, une zone autorisée ou attendre qu''une place se libère',
    'L''absence de place disponible ne justifie pas un stationnement illégal.',
    'Stationnement', 'easy', true,
    'Prévoyez du temps pour chercher une place, surtout en centre-ville.'
  ),
  (
    'Est-il permis de stationner dans un virage ?',
    '["Non, cela réduit la visibilité et crée un danger", "Oui si le virage est large", "Oui avec les feux de détresse", "Non seulement la nuit"]',
    'Non, cela réduit la visibilité et crée un danger',
    'Stationner dans un virage masque le danger aux conducteurs arrivant de l''autre côté.',
    'Stationnement', 'easy', true,
    'Même un arrêt momentané dans un virage peut être fatal en cas de collision.'
  ),
  (
    'Que signifie une ligne jaune discontinue au bord de la chaussée ?',
    '["Arrêt momentané autorisé, stationnement interdit", "Stationnement autorisé", "Arrêt et stationnement interdits", "Voie réservée aux bus"]',
    'Arrêt momentané autorisé, stationnement interdit',
    'La ligne jaune discontinue indique une zone où l''on peut s''arrêter brièvement mais pas stationner.',
    'Stationnement', 'medium', true,
    'Une ligne jaune continue signifie arrêt et stationnement tous les deux interdits.'
  ),
  (
    'Peut-on se garer devant une bouche d''incendie (borne à incendie) ?',
    '["Non, c''est strictement interdit pour permettre l''accès aux pompiers", "Oui si c''est pour moins de 10 minutes", "Oui la nuit quand les pompiers ne travaillent pas", "Oui si le capot ne la couvre pas"]',
    'Non, c''est strictement interdit pour permettre l''accès aux pompiers',
    'Les pompiers doivent pouvoir accéder aux bornes à incendie en toute urgence.',
    'Stationnement', 'easy', true,
    'Une obstruction de borne peut retarder l''intervention des pompiers et coûter des vies.'
  ),

-- ── 10. Conduite de nuit (10) ────────────────────────────────────────────────
  (
    'Quels phares utiliser en dehors des agglomérations la nuit en l''absence de véhicule en face ?',
    '["Les phares de route (pleins phares)", "Les feux de position uniquement", "Les feux de croisement", "Aucun phare n''est obligatoire"]',
    'Les phares de route (pleins phares)',
    'Les phares de route éclairent jusqu''à 100 m devant, améliorant considérablement la visibilité.',
    'Conduite de nuit', 'easy', true,
    'Basculez immédiatement en feux de croisement dès qu''un véhicule arrive en sens inverse.'
  ),
  (
    'Pourquoi la conduite de nuit est-elle plus dangereuse que de jour ?',
    '["La visibilité est réduite, la fatigue est plus présente et les contrastes sont difficiles", "Les routes sont plus glissantes la nuit", "Les animaux ne sortent que la nuit", "Les limitations de vitesse changent"]',
    'La visibilité est réduite, la fatigue est plus présente et les contrastes sont difficiles',
    'La nuit, le champ de vision est réduit à la zone éclairée par les phares.',
    'Conduite de nuit', 'easy', true,
    'Réduisez votre vitesse la nuit : votre distance de freinage peut dépasser votre distance d''éclairage.'
  ),
  (
    'Que faire si vous êtes ébloui par les phares d''un véhicule venant en sens inverse ?',
    '["Regarder sur le bord droit de la chaussée, ralentir sans freiner brusquement", "Allumer vos pleins phares en retour", "Fermer les yeux", "Accélérer pour passer rapidement"]',
    'Regarder sur le bord droit de la chaussée, ralentir sans freiner brusquement',
    'Fixer les phares en face aggrave l''éblouissement. Regarder sur le côté protège votre vision.',
    'Conduite de nuit', 'medium', true,
    'Après éblouissement, votre vision met quelques secondes à récupérer : soyez patient.'
  ),
  (
    'Quelle distance d''arrêt peut-on estimer à 90 km/h de nuit ?',
    '["Environ 85 à 100 mètres (réaction + freinage)", "30 mètres", "50 mètres", "200 mètres"]',
    'Environ 85 à 100 mètres (réaction + freinage)',
    'La nuit, les feux de croisement n''éclairent qu''à 50–60 m, bien en deçà de la distance d''arrêt.',
    'Conduite de nuit', 'medium', true,
    'La règle "voir pour s''arrêter" est essentielle : si vous ne voyez qu''à 60 m, roulez à 60 km/h max.'
  ),
  (
    'Doit-on allumer ses feux dans un tunnel même en journée ?',
    '["Oui, les feux de croisement sont obligatoires dans un tunnel", "Non si le tunnel est court", "Seulement si le tunnel est sombre", "Uniquement la nuit"]',
    'Oui, les feux de croisement sont obligatoires dans un tunnel',
    'Dans un tunnel, l''éclairage artificiel est insuffisant et être visible par les autres est essentiel.',
    'Conduite de nuit', 'easy', true,
    'Allumez vos feux avant d''entrer dans le tunnel pour vous habituer au changement de luminosité.'
  ),
  (
    'Pourquoi ne faut-il pas utiliser les feux de brouillard arrière par temps clair ?',
    '["Ils éblouissent les conducteurs qui vous suivent et masquent vos feux de freinage", "Ils consomment trop d''énergie", "Ils sont uniquement réservés à l''avant", "Ils réduisent la visibilité à l''avant"]',
    'Ils éblouissent les conducteurs qui vous suivent et masquent vos feux de freinage',
    'Les feux de brouillard arrière ne doivent être utilisés qu''en cas de visibilité réduite (moins de 50 m).',
    'Conduite de nuit', 'medium', true,
    'En l''absence de brouillard dense, éteignez vos feux de brouillard arrière.'
  ),
  (
    'Quels feux utiliser lors d''un arrêt sur le bord de la route de nuit ?',
    '["Feux de position et feux de détresse si nécessaire", "Pleins phares pour être vu", "Aucun feu pour économiser la batterie", "Feux de croisement uniquement"]',
    'Feux de position et feux de détresse si nécessaire',
    'Rester visible lors d''un arrêt sur le bord de la route réduit le risque d''être percuté.',
    'Conduite de nuit', 'medium', true,
    'Placez également un triangle à 30 m en arrière du véhicule pour alerter les autres conducteurs.'
  ),
  (
    'Comment adapter sa vitesse à la conduite de nuit ?',
    '["Réduire sa vitesse pour que la distance de freinage reste inférieure à la distance éclairée", "Rouler plus vite pour finir le trajet rapidement", "Maintenir la même vitesse que de jour", "Rouler à vitesse maximale autorisée en toute circonstance"]',
    'Réduire sa vitesse pour que la distance de freinage reste inférieure à la distance éclairée',
    'La portée des phares de croisement est d''environ 50 m ; à 90 km/h, la distance de freinage dépasse 80 m.',
    'Conduite de nuit', 'medium', true,
    'Conduire dans ses phares = adapter sa vitesse à la portée de son éclairage.'
  ),
  (
    'Les animaux sauvages sur la route sont surtout un danger :',
    '["La nuit et en zone rurale", "Uniquement en forêt", "Seulement en journée", "Jamais sur les routes goudronnées"]',
    'La nuit et en zone rurale',
    'Les animaux sauvages sont plus actifs la nuit et difficiles à détecter avec les feux de croisement.',
    'Conduite de nuit', 'easy', true,
    'Si vous voyez un animal, ralentissez progressivement : il peut y en avoir d''autres.'
  ),
  (
    'Que faire pour lutter contre la somnolence lors d''un trajet de nuit ?',
    '["S''arrêter, faire une pause et dormir si nécessaire", "Ouvrir la fenêtre et écouter de la musique forte", "Boire du café et continuer", "Accélérer pour finir plus vite"]',
    'S''arrêter, faire une pause et dormir si nécessaire',
    'La somnolence est aussi dangereuse que l''alcool : l''endormissement au volant peut être fatal.',
    'Conduite de nuit', 'easy', true,
    'La seule solution efficace contre le sommeil est de dormir : les stimulants ne font que retarder l''inévitable.'
  ),

-- ── 11. Urgences (10) ────────────────────────────────────────────────────────
  (
    'Quelle est la première chose à faire après un accident avec des blessés ?',
    '["Sécuriser les lieux et appeler les secours (SAMU, pompiers, police)", "Prendre des photos", "Déplacer les blessés", "Partir chercher de l''aide"]',
    'Sécuriser les lieux et appeler les secours (SAMU, pompiers, police)',
    'La priorité est d''éviter un sur-accident et d''obtenir rapidement les secours professionnels.',
    'Urgences', 'easy', true,
    'Ne déplacez pas les blessés sauf en cas de danger immédiat (incendie, noyade).'
  ),
  (
    'Que faire si votre accélérateur se bloque (emballement moteur) ?',
    '["Mettre le levier en point mort, freiner progressivement et couper le moteur", "Couper le moteur immédiatement à grande vitesse", "Pomper le frein rapidement", "Passer en marche arrière"]',
    'Mettre le levier en point mort, freiner progressivement et couper le moteur',
    'Passer en point mort désengage le moteur des roues et permet de freiner sans risque de blocage.',
    'Urgences', 'medium', true,
    'Ne coupez jamais le moteur à grande vitesse : vous perdriez l''assistance direction et freinage.'
  ),
  (
    'Que faire si vos freins ne répondent plus ?',
    '["Pomper la pédale, utiliser le frein à main progressivement et chercher à s''arrêter en toute sécurité", "Couper le moteur immédiatement", "Accélérer pour rester dans la voie", "Sauter du véhicule"]',
    'Pomper la pédale, utiliser le frein à main progressivement et chercher à s''arrêter en toute sécurité',
    'Pomper la pédale peut reconstruire de la pression hydraulique. Le frein à main complète l''action.',
    'Urgences', 'medium', true,
    'Cherchez aussi à vous diriger vers un obstacle naturel (talus, buisson) pour ralentir progressivement.'
  ),
  (
    'Comment pratiquer les gestes de premier secours sur une victime inconsciente qui respire ?',
    '["La placer en position latérale de sécurité (PLS) et appeler les secours", "La laisser sur le dos", "Lui donner de l''eau", "La faire marcher pour la garder éveillée"]',
    'La placer en position latérale de sécurité (PLS) et appeler les secours',
    'La PLS évite l''asphyxie par la langue ou les vomissements chez une victime inconsciente.',
    'Urgences', 'medium', true,
    'Formation gratuite aux gestes de premier secours disponible dans les centres de la Croix-Rouge.'
  ),
  (
    'Qu''est-ce qu''un triangle de présignalisation et à quelle distance le placer ?',
    '["Un triangle rouge réfléchissant placé à au moins 30 m en amont du véhicule en panne", "Un cône orange placé devant le véhicule", "Un signal sonore", "Un feu clignotant placé à 5 m"]',
    'Un triangle rouge réfléchissant placé à au moins 30 m en amont du véhicule en panne',
    'Le triangle alerte les conducteurs arrivant d''un danger devant eux.',
    'Urgences', 'easy', true,
    'Sur autoroute, placez le triangle à au moins 100 m pour tenir compte des vitesses élevées.'
  ),
  (
    'Que faire si un piéton est renversé et ne bouge plus ?',
    '["Appeler immédiatement les secours, ne pas le déplacer sauf danger immédiat, le rassurer", "Le relever et l''asseoir", "Lui donner à boire", "Attendre qu''il reprenne connaissance seul"]',
    'Appeler immédiatement les secours, ne pas le déplacer sauf danger immédiat, le rassurer',
    'Déplacer un blessé mal peut aggraver une lésion de la colonne vertébrale.',
    'Urgences', 'medium', true,
    'Parlez doucement à la victime même si elle semble inconsciente : elle peut vous entendre.'
  ),
  (
    'Que faire si votre direction se bloque en pleine route ?',
    '["Ne pas paniquer, freiner progressivement, allumer les feux de détresse et s''arrêter sur le côté", "Couper le moteur immédiatement", "Accélérer pour dépasser le problème", "Braquer brutalement dans le sens opposé"]',
    'Ne pas paniquer, freiner progressivement, allumer les feux de détresse et s''arrêter sur le côté',
    'Un blocage de direction est une urgence mécanique grave ; la priorité est de s''immobiliser en sécurité.',
    'Urgences', 'medium', true,
    'Gardez les deux mains fermes sur le volant pour maintenir la trajectoire au maximum.'
  ),
  (
    'Que faire si vous voyez un feu de forêt proche de la route ?',
    '["Ne pas s''arrêter pour observer, accélérer et quitter la zone, signaler aux autorités", "S''arrêter et prendre des photos", "Essayer d''éteindre le feu", "Faire demi-tour"]',
    'Ne pas s''arrêter pour observer, accélérer et quitter la zone, signaler aux autorités',
    'Un feu de forêt peut se propager en quelques secondes et couper une route.',
    'Urgences', 'medium', true,
    'Ne rebroussez chemin que si la route devant vous est bloquée par les flammes.'
  ),
  (
    'Comment signaler sa présence lors d''une panne sur autoroute ?',
    '["Allumer les feux de détresse, porter le gilet réfléchissant, placer le triangle et se mettre derrière la glissière", "Rester dans le véhicule avec les feux éteints", "Marcher sur la voie pour arrêter les voitures", "Téléphoner sans s''éloigner du véhicule"]',
    'Allumer les feux de détresse, porter le gilet réfléchissant, placer le triangle et se mettre derrière la glissière',
    'L''autoroute est très dangereuse pour les piétons : la glissière de sécurité protège des véhicules.',
    'Urgences', 'medium', true,
    'En France, le gilet réfléchissant doit être accessible depuis l''habitacle, pas dans le coffre.'
  ),
  (
    'Que contient un kit de premier secours minimum à avoir dans son véhicule ?',
    '["Pansements, bandages, gants, couverture de survie, ciseaux et notice de premiers secours", "Seulement des médicaments", "Un téléphone portable uniquement", "Une bouteille d''eau et de la nourriture"]',
    'Pansements, bandages, gants, couverture de survie, ciseaux et notice de premiers secours',
    'Ce kit permet de traiter les blessures légères et d''assister les blessés en attendant les secours.',
    'Urgences', 'easy', true,
    'Vérifiez les dates de péremption de votre kit au moins une fois par an.'
  )

ON CONFLICT (question_text) DO NOTHING;
