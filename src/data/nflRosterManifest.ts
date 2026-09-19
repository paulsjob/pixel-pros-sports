export interface ManifestAthlete {
  athleteId: string;
  displayName: string;
  shortName: string;
  uniformNumber: number;
  teamCode: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K';
  skinTone?: string;
}

export const NFL_ROSTER_MANIFEST: Record<string, ManifestAthlete[]> = {
  ARI: [
    { athleteId: '3917315', displayName: 'Kyler Murray', shortName: 'MURRAY', uniformNumber: 1, teamCode: 'ARI', position: 'QB', skinTone: '#e0ac69' },
    { athleteId: '3045147', displayName: 'James Conner', shortName: 'CONNER', uniformNumber: 6, teamCode: 'ARI', position: 'RB', skinTone: '#c68642' },
    { athleteId: '4429275', displayName: 'Trey Benson', shortName: 'BENSON', uniformNumber: 33, teamCode: 'ARI', position: 'RB', skinTone: '#8d5524' },
    { athleteId: '4432708', displayName: 'Marvin Harrison Jr.', shortName: 'HARRISON JR', uniformNumber: 18, teamCode: 'ARI', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4360761', displayName: 'Michael Wilson', shortName: 'WILSON', uniformNumber: 14, teamCode: 'ARI', position: 'WR', skinTone: '#c68642' },
    { athleteId: '4037235', displayName: 'Greg Dortch', shortName: 'DORTCH', uniformNumber: 19, teamCode: 'ARI', position: 'WR', skinTone: '#523318' },
    { athleteId: '4361307', displayName: 'Trey McBride', shortName: 'MCBRIDE', uniformNumber: 85, teamCode: 'ARI', position: 'TE', skinTone: '#f8d9b6' },
  ],
  ATL: [
    { athleteId: '14880', displayName: 'Kirk Cousins', shortName: 'COUSINS', uniformNumber: 8, teamCode: 'ATL', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4430807', displayName: 'Bijan Robinson', shortName: 'ROBINSON', uniformNumber: 7, teamCode: 'ATL', position: 'RB', skinTone: '#523318' },
    { athleteId: '4373626', displayName: 'Tyler Allgeier', shortName: 'ALLGEIER', uniformNumber: 22, teamCode: 'ATL', position: 'RB', skinTone: '#8d5524' },
    { athleteId: '4426502', displayName: 'Drake London', shortName: 'LONDON', uniformNumber: 5, teamCode: 'ATL', position: 'WR', skinTone: '#c68642' },
    { athleteId: '4040655', displayName: 'Darnell Mooney', shortName: 'MOONEY', uniformNumber: 17, teamCode: 'ATL', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '2976535', displayName: 'Ray-Ray McCloud III', shortName: 'MCCLOUD', uniformNumber: 34, teamCode: 'ATL', position: 'WR', skinTone: '#523318' },
    { athleteId: '4360248', displayName: 'Kyle Pitts', shortName: 'PITTS', uniformNumber: 8, teamCode: 'ATL', position: 'TE', skinTone: '#8d5524' },
  ],
  BAL: [
    { athleteId: '3916387', displayName: 'Lamar Jackson', shortName: 'JACKSON', uniformNumber: 8, teamCode: 'BAL', position: 'QB', skinTone: '#523318' },
    { athleteId: '3043078', displayName: 'Derrick Henry', shortName: 'HENRY', uniformNumber: 22, teamCode: 'BAL', position: 'RB', skinTone: '#523318' },
    { athleteId: '4038441', displayName: 'Justice Hill', shortName: 'HILL', uniformNumber: 43, teamCode: 'BAL', position: 'RB', skinTone: '#8d5524' },
    { athleteId: '4429615', displayName: 'Zay Flowers', shortName: 'FLOWERS', uniformNumber: 4, teamCode: 'BAL', position: 'WR', skinTone: '#523318' },
    { athleteId: '4360939', displayName: 'Rashod Bateman', shortName: 'BATEMAN', uniformNumber: 7, teamCode: 'BAL', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '2576434', displayName: 'Nelson Agholor', shortName: 'AGHOLOR', uniformNumber: 15, teamCode: 'BAL', position: 'WR', skinTone: '#523318' },
    { athleteId: '3116365', displayName: 'Mark Andrews', shortName: 'ANDREWS', uniformNumber: 89, teamCode: 'BAL', position: 'TE', skinTone: '#f8d9b6' },
    { athleteId: '4361050', displayName: 'Isaiah Likely', shortName: 'LIKELY', uniformNumber: 9, teamCode: 'BAL', position: 'TE', skinTone: '#523318' },
  ],
  BUF: [
    { athleteId: '3918298', displayName: 'Josh Allen', shortName: 'ALLEN', uniformNumber: 17, teamCode: 'BUF', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4362628', displayName: 'James Cook', shortName: 'COOK', uniformNumber: 4, teamCode: 'BUF', position: 'RB', skinTone: '#523318' },
    { athleteId: '4429501', displayName: 'Ray Davis', shortName: 'DAVIS', uniformNumber: 7, teamCode: 'BUF', position: 'RB', skinTone: '#8d5524' },
    { athleteId: '4373678', displayName: 'Khalil Shakir', shortName: 'SHAKIR', uniformNumber: 10, teamCode: 'BUF', position: 'WR', skinTone: '#c68642' },
    { athleteId: '4635008', displayName: 'Keon Coleman', shortName: 'COLEMAN', uniformNumber: 0, teamCode: 'BUF', position: 'WR', skinTone: '#523318' },
    { athleteId: '3116163', displayName: 'Curtis Samuel', shortName: 'SAMUEL', uniformNumber: 1, teamCode: 'BUF', position: 'WR', skinTone: '#523318' },
    { athleteId: '4385690', displayName: 'Dalton Kincaid', shortName: 'KINCAID', uniformNumber: 86, teamCode: 'BUF', position: 'TE', skinTone: '#f8d9b6' },
    { athleteId: '3930086', displayName: 'Dawson Knox', shortName: 'KNOX', uniformNumber: 88, teamCode: 'BUF', position: 'TE', skinTone: '#f8d9b6' },
  ],
  CAR: [
    { athleteId: '4685720', displayName: 'Bryce Young', shortName: 'YOUNG', uniformNumber: 9, teamCode: 'CAR', position: 'QB', skinTone: '#8d5524' },
    { athleteId: '4241416', displayName: 'Chuba Hubbard', shortName: 'HUBBARD', uniformNumber: 30, teamCode: 'CAR', position: 'RB', skinTone: '#523318' },
    { athleteId: '4035687', displayName: 'Miles Sanders', shortName: 'SANDERS', uniformNumber: 6, teamCode: 'CAR', position: 'RB', skinTone: '#523318' },
    { athleteId: '3916433', displayName: 'Diontae Johnson', shortName: 'JOHNSON', uniformNumber: 5, teamCode: 'CAR', position: 'WR', skinTone: '#523318' },
    { athleteId: '4430034', displayName: 'Xavier Legette', shortName: 'LEGETTE', uniformNumber: 17, teamCode: 'CAR', position: 'WR', skinTone: '#523318' },
    { athleteId: '4695883', displayName: 'Jalen Coker', shortName: 'COKER', uniformNumber: 18, teamCode: 'CAR', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '15818', displayName: 'Adam Thielen', shortName: 'THIELEN', uniformNumber: 19, teamCode: 'CAR', position: 'WR', skinTone: '#f8d9b6' },
    { athleteId: '4432709', displayName: "Ja'Tavion Sanders", shortName: 'SANDERS', uniformNumber: 85, teamCode: 'CAR', position: 'TE', skinTone: '#523318' },
    { athleteId: '4372780', displayName: 'Tommy Tremble', shortName: 'TREMBLE', uniformNumber: 82, teamCode: 'CAR', position: 'TE', skinTone: '#8d5524' },
  ],
  CHI: [
    { athleteId: '4431611', displayName: 'Caleb Williams', shortName: 'WILLIAMS', uniformNumber: 18, teamCode: 'CHI', position: 'QB', skinTone: '#8d5524' },
    { athleteId: '4259545', displayName: "D'Andre Swift", shortName: 'SWIFT', uniformNumber: 4, teamCode: 'CHI', position: 'RB', skinTone: '#523318' },
    { athleteId: '4426386', displayName: 'Roschon Johnson', shortName: 'JOHNSON', uniformNumber: 23, teamCode: 'CHI', position: 'RB', skinTone: '#523318' },
    { athleteId: '3915416', displayName: 'DJ Moore', shortName: 'MOORE', uniformNumber: 2, teamCode: 'CHI', position: 'WR', skinTone: '#523318' },
    { athleteId: 'chi_13_keenanallen', displayName: 'Keenan Allen', shortName: 'ALLEN', uniformNumber: 10, teamCode: 'CHI', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4431299', displayName: 'Rome Odunze', shortName: 'ODUNZE', uniformNumber: 15, teamCode: 'CHI', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4258595', displayName: 'Cole Kmet', shortName: 'KMET', uniformNumber: 85, teamCode: 'CHI', position: 'TE', skinTone: '#f8d9b6' },
  ],
  CIN: [
    { athleteId: '3915511', displayName: 'Joe Burrow', shortName: 'BURROW', uniformNumber: 9, teamCode: 'CIN', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4035676', displayName: 'Zack Moss', shortName: 'MOSS', uniformNumber: 31, teamCode: 'CIN', position: 'RB', skinTone: '#523318' },
    { athleteId: '4362238', displayName: 'Chase Brown', shortName: 'BROWN', uniformNumber: 30, teamCode: 'CIN', position: 'RB', skinTone: '#8d5524' },
    { athleteId: '4362628', displayName: "Ja'Marr Chase", shortName: 'CHASE', uniformNumber: 1, teamCode: 'CIN', position: 'WR', skinTone: '#523318' },
    { athleteId: '4239993', displayName: 'Tee Higgins', shortName: 'HIGGINS', uniformNumber: 5, teamCode: 'CIN', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4368003', displayName: 'Andrei Iosivas', shortName: 'IOSIVAS', uniformNumber: 80, teamCode: 'CIN', position: 'WR', skinTone: '#c68642' },
    { athleteId: '3116164', displayName: 'Mike Gesicki', shortName: 'GESICKI', uniformNumber: 88, teamCode: 'CIN', position: 'TE', skinTone: '#f8d9b6' },
  ],
  CLE: [
    { athleteId: '3122840', displayName: 'Deshaun Watson', shortName: 'WATSON', uniformNumber: 4, teamCode: 'CLE', position: 'QB', skinTone: '#523318' },
    { athleteId: '4372019', displayName: 'Jerome Ford', shortName: 'FORD', uniformNumber: 34, teamCode: 'CLE', position: 'RB', skinTone: '#523318' },
    { athleteId: '3128720', displayName: 'Nick Chubb', shortName: 'CHUBB', uniformNumber: 24, teamCode: 'CLE', position: 'RB', skinTone: '#523318' },
    { athleteId: '4241463', displayName: 'Jerry Jeudy', shortName: 'JEUDY', uniformNumber: 3, teamCode: 'CLE', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4369863', displayName: 'Cedric Tillman', shortName: 'TILLMAN', uniformNumber: 19, teamCode: 'CLE', position: 'WR', skinTone: '#523318' },
    { athleteId: '4372414', displayName: 'Elijah Moore', shortName: 'MOORE', uniformNumber: 19, teamCode: 'CLE', position: 'WR', skinTone: '#523318' },
    { athleteId: '3123076', displayName: 'David Njoku', shortName: 'NJOKU', uniformNumber: 83, teamCode: 'CLE', position: 'TE', skinTone: '#523318' },
  ],
  DAL: [
    { athleteId: '2577417', displayName: 'Dak Prescott', shortName: 'PRESCOTT', uniformNumber: 4, teamCode: 'DAL', position: 'QB', skinTone: '#8d5524' },
    { athleteId: '4038815', displayName: 'Rico Dowdle', shortName: 'DOWDLE', uniformNumber: 13, teamCode: 'DAL', position: 'RB', skinTone: '#523318' },
    { athleteId: '3059915', displayName: 'Ezekiel Elliott', shortName: 'ELLIOTT', uniformNumber: 15, teamCode: 'DAL', position: 'RB', skinTone: '#523318' },
    { athleteId: '4241389', displayName: 'CeeDee Lamb', shortName: 'LAMB', uniformNumber: 88, teamCode: 'DAL', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '16725', displayName: 'Brandin Cooks', shortName: 'COOKS', uniformNumber: 3, teamCode: 'DAL', position: 'WR', skinTone: '#523318' },
    { athleteId: '4249417', displayName: 'Jalen Tolbert', shortName: 'TOLBERT', uniformNumber: 1, teamCode: 'DAL', position: 'WR', skinTone: '#523318' },
    { athleteId: '4242355', displayName: 'Jake Ferguson', shortName: 'FERGUSON', uniformNumber: 87, teamCode: 'DAL', position: 'TE', skinTone: '#f8d9b6' },
  ],
  DEN: [
    { athleteId: '4426338', displayName: 'Bo Nix', shortName: 'NIX', uniformNumber: 10, teamCode: 'DEN', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4361579', displayName: 'Javonte Williams', shortName: 'WILLIAMS', uniformNumber: 33, teamCode: 'DEN', position: 'RB', skinTone: '#523318' },
    { athleteId: '4722893', displayName: 'Jaleel McLaughlin', shortName: 'MCLAUGHLIN', uniformNumber: 38, teamCode: 'DEN', position: 'RB', skinTone: '#523318' },
    { athleteId: '3128429', displayName: 'Courtland Sutton', shortName: 'SUTTON', uniformNumber: 14, teamCode: 'DEN', position: 'WR', skinTone: '#523318' },
    { athleteId: '4431280', displayName: 'Troy Franklin', shortName: 'FRANKLIN', uniformNumber: 11, teamCode: 'DEN', position: 'WR', skinTone: '#523318' },
    { athleteId: '4036125', displayName: "Lil'Jordan Humphrey", shortName: 'HUMPHREY', uniformNumber: 84, teamCode: 'DEN', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4367209', displayName: 'Greg Dulcich', shortName: 'DULCICH', uniformNumber: 85, teamCode: 'DEN', position: 'TE', skinTone: '#f8d9b6' },
  ],
  DET: [
    { athleteId: '3046779', displayName: 'Jared Goff', shortName: 'GOFF', uniformNumber: 16, teamCode: 'DET', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4429795', displayName: 'Jahmyr Gibbs', shortName: 'GIBBS', uniformNumber: 26, teamCode: 'DET', position: 'RB', skinTone: '#523318' },
    { athleteId: '4035538', displayName: 'David Montgomery', shortName: 'MONTGOMERY', uniformNumber: 32, teamCode: 'DET', position: 'RB', skinTone: '#523318' },
    { athleteId: '4374302', displayName: 'Amon-Ra St. Brown', shortName: 'ST. BROWN', uniformNumber: 14, teamCode: 'DET', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4426388', displayName: 'Jameson Williams', shortName: 'WILLIAMS', uniformNumber: 1, teamCode: 'DET', position: 'WR', skinTone: '#523318' },
    { athleteId: '2973405', displayName: 'Kalif Raymond', shortName: 'RAYMOND', uniformNumber: 14, teamCode: 'DET', position: 'WR', skinTone: '#523318' },
    { athleteId: '4430027', displayName: 'Sam LaPorta', shortName: 'LAPORTA', uniformNumber: 87, teamCode: 'DET', position: 'TE', skinTone: '#f8d9b6' },
  ],
  GB: [
    { athleteId: '4036378', displayName: 'Jordan Love', shortName: 'LOVE', uniformNumber: 10, teamCode: 'GB', position: 'QB', skinTone: '#8d5524' },
    { athleteId: '4047365', displayName: 'Josh Jacobs', shortName: 'JACOBS', uniformNumber: 8, teamCode: 'GB', position: 'RB', skinTone: '#523318' },
    { athleteId: '4887558', displayName: 'Emanuel Wilson', shortName: 'WILSON', uniformNumber: 23, teamCode: 'GB', position: 'RB', skinTone: '#523318' },
    { athleteId: '4362249', displayName: 'Jayden Reed', shortName: 'REED', uniformNumber: 11, teamCode: 'GB', position: 'WR', skinTone: '#523318' },
    { athleteId: '4361432', displayName: 'Romeo Doubs', shortName: 'DOUBS', uniformNumber: 87, teamCode: 'GB', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4248528', displayName: 'Christian Watson', shortName: 'WATSON', uniformNumber: 9, teamCode: 'GB', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4572680', displayName: 'Tucker Kraft', shortName: 'KRAFT', uniformNumber: 85, teamCode: 'GB', position: 'TE', skinTone: '#f8d9b6' },
  ],
  HOU: [
    { athleteId: '4432577', displayName: 'C.J. Stroud', shortName: 'STROUD', uniformNumber: 7, teamCode: 'HOU', position: 'QB', skinTone: '#8d5524' },
    { athleteId: '3116385', displayName: 'Joe Mixon', shortName: 'MIXON', uniformNumber: 28, teamCode: 'HOU', position: 'RB', skinTone: '#523318' },
    { athleteId: '4240022', displayName: 'Cam Akers', shortName: 'AKERS', uniformNumber: 22, teamCode: 'HOU', position: 'RB', skinTone: '#523318' },
    { athleteId: '4258173', displayName: 'Nico Collins', shortName: 'COLLINS', uniformNumber: 12, teamCode: 'HOU', position: 'WR', skinTone: '#523318' },
    { athleteId: '2976212', displayName: 'Stefon Diggs', shortName: 'DIGGS', uniformNumber: 3, teamCode: 'HOU', position: 'WR', skinTone: '#523318' },
    { athleteId: '4366031', displayName: 'Tank Dell', shortName: 'DELL', uniformNumber: 1, teamCode: 'HOU', position: 'WR', skinTone: '#523318' },
    { athleteId: '3117256', displayName: 'Dalton Schultz', shortName: 'SCHULTZ', uniformNumber: 86, teamCode: 'HOU', position: 'TE', skinTone: '#f8d9b6' },
  ],
  IND: [
    { athleteId: '4431520', displayName: 'Anthony Richardson', shortName: 'RICHARDSON', uniformNumber: 5, teamCode: 'IND', position: 'QB', skinTone: '#523318' },
    { athleteId: '4242335', displayName: 'Jonathan Taylor', shortName: 'TAYLOR', uniformNumber: 28, teamCode: 'IND', position: 'RB', skinTone: '#523318' },
    { athleteId: '4241401', displayName: 'Trey Sermon', shortName: 'SERMON', uniformNumber: 44, teamCode: 'IND', position: 'RB', skinTone: '#523318' },
    { athleteId: 'ind_11_michaelpittmanjr', displayName: 'Michael Pittman Jr.', shortName: 'PITTMAN', uniformNumber: 11, teamCode: 'IND', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4360078', displayName: 'Alec Pierce', shortName: 'PIERCE', uniformNumber: 14, teamCode: 'IND', position: 'WR', skinTone: '#f8d9b6' },
    { athleteId: '4688813', displayName: 'Josh Downs', shortName: 'DOWNS', uniformNumber: 2, teamCode: 'IND', position: 'WR', skinTone: '#523318' },
    { athleteId: '4039160', displayName: 'Kylen Granson', shortName: 'GRANSON', uniformNumber: 86, teamCode: 'IND', position: 'TE', skinTone: '#8d5524' },
  ],
  JAX: [
    { athleteId: '4360310', displayName: 'Trevor Lawrence', shortName: 'LAWRENCE', uniformNumber: 16, teamCode: 'JAX', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4239996', displayName: 'Travis Etienne Jr.', shortName: 'ETIENNE', uniformNumber: 3, teamCode: 'JAX', position: 'RB', skinTone: '#523318' },
    { athleteId: '4429013', displayName: 'Tank Bigsby', shortName: 'BIGSBY', uniformNumber: 8, teamCode: 'JAX', position: 'RB', skinTone: '#523318' },
    { athleteId: '4432773', displayName: 'Brian Thomas Jr.', shortName: 'THOMAS JR', uniformNumber: 7, teamCode: 'JAX', position: 'WR', skinTone: '#523318' },
    { athleteId: '3895856', displayName: 'Christian Kirk', shortName: 'KIRK', uniformNumber: 3, teamCode: 'JAX', position: 'WR', skinTone: '#8d5524' },
    { athleteId: 'jax_0_gabedavis', displayName: 'Gabe Davis', shortName: 'DAVIS', uniformNumber: 0, teamCode: 'JAX', position: 'WR', skinTone: '#523318' },
    { athleteId: '3051876', displayName: 'Evan Engram', shortName: 'ENGRAM', uniformNumber: 1, teamCode: 'JAX', position: 'TE', skinTone: '#8d5524' },
  ],
  KC: [
    { athleteId: '3139477', displayName: 'Patrick Mahomes', shortName: 'MAHOMES', uniformNumber: 15, teamCode: 'KC', position: 'QB', skinTone: '#8d5524' },
    { athleteId: '4361529', displayName: 'Isiah Pacheco', shortName: 'PACHECO', uniformNumber: 10, teamCode: 'KC', position: 'RB', skinTone: '#8d5524' },
    { athleteId: 'kc_29_kareemhunt', displayName: 'Kareem Hunt', shortName: 'HUNT', uniformNumber: 29, teamCode: 'KC', position: 'RB', skinTone: '#523318' },
    { athleteId: '4683062', displayName: 'Xavier Worthy', shortName: 'WORTHY', uniformNumber: 1, teamCode: 'KC', position: 'WR', skinTone: '#523318' },
    { athleteId: '4428331', displayName: 'Rashee Rice', shortName: 'RICE', uniformNumber: 4, teamCode: 'KC', position: 'WR', skinTone: '#523318' },
    { athleteId: '3121422', displayName: 'JuJu Smith-Schuster', shortName: 'SMITH-SCHUSTER', uniformNumber: 9, teamCode: 'KC', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '15847', displayName: 'Travis Kelce', shortName: 'KELCE', uniformNumber: 87, teamCode: 'KC', position: 'TE', skinTone: '#f8d9b6' },
  ],
  LAC: [
    { athleteId: '4038941', displayName: 'Justin Herbert', shortName: 'HERBERT', uniformNumber: 10, teamCode: 'LAC', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4241985', displayName: 'J.K. Dobbins', shortName: 'DOBBINS', uniformNumber: 27, teamCode: 'LAC', position: 'RB', skinTone: '#523318' },
    { athleteId: '3051889', displayName: 'Gus Edwards', shortName: 'EDWARDS', uniformNumber: 4, teamCode: 'LAC', position: 'RB', skinTone: '#523318' },
    { athleteId: '4612826', displayName: 'Ladd McConkey', shortName: 'MCCONKEY', uniformNumber: 15, teamCode: 'LAC', position: 'WR', skinTone: '#f8d9b6' },
    { athleteId: '4429025', displayName: 'Quentin Johnston', shortName: 'JOHNSTON', uniformNumber: 1, teamCode: 'LAC', position: 'WR', skinTone: '#523318' },
    { athleteId: '4242433', displayName: 'Joshua Palmer', shortName: 'PALMER', uniformNumber: 5, teamCode: 'LAC', position: 'WR', skinTone: '#523318' },
    { athleteId: '16775', displayName: 'Will Dissly', shortName: 'DISSLY', uniformNumber: 81, teamCode: 'LAC', position: 'TE', skinTone: '#f8d9b6' },
  ],
  LAR: [
    { athleteId: '12483', displayName: 'Matthew Stafford', shortName: 'STAFFORD', uniformNumber: 9, teamCode: 'LAR', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4430737', displayName: 'Kyren Williams', shortName: 'WILLIAMS', uniformNumber: 23, teamCode: 'LAR', position: 'RB', skinTone: '#523318' },
    { athleteId: '4429096', displayName: 'Blake Corum', shortName: 'CORUM', uniformNumber: 24, teamCode: 'LAR', position: 'RB', skinTone: '#8d5524' },
    { athleteId: '2977187', displayName: 'Cooper Kupp', shortName: 'KUPP', uniformNumber: 10, teamCode: 'LAR', position: 'WR', skinTone: '#f8d9b6' },
    { athleteId: '4426515', displayName: 'Puka Nacua', shortName: 'NACUA', uniformNumber: 12, teamCode: 'LAR', position: 'WR', skinTone: '#c68642' },
    { athleteId: '3043116', displayName: 'Demarcus Robinson', shortName: 'ROBINSON', uniformNumber: 11, teamCode: 'LAR', position: 'WR', skinTone: '#523318' },
    { athleteId: '4242557', displayName: 'Colby Parkinson', shortName: 'PARKINSON', uniformNumber: 84, teamCode: 'LAR', position: 'TE', skinTone: '#f8d9b6' },
  ],
  LV: [
    { athleteId: '4038524', displayName: 'Gardner Minshew', shortName: 'MINSHEW', uniformNumber: 15, teamCode: 'LV', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: 'lv_22_alexandermattison', displayName: 'Alexander Mattison', shortName: 'MATTISON', uniformNumber: 22, teamCode: 'LV', position: 'RB', skinTone: '#523318' },
    { athleteId: '4361777', displayName: 'Zamir White', shortName: 'WHITE', uniformNumber: 33, teamCode: 'LV', position: 'RB', skinTone: '#523318' },
    { athleteId: 'lv_16_jakobimeyers', displayName: 'Jakobi Meyers', shortName: 'MEYERS', uniformNumber: 3, teamCode: 'LV', position: 'WR', skinTone: '#523318' },
    { athleteId: '4428718', displayName: 'Tre Tucker', shortName: 'TUCKER', uniformNumber: 1, teamCode: 'LV', position: 'WR', skinTone: '#523318' },
    { athleteId: 'lv_84_djturner', displayName: 'DJ Turner', shortName: 'TURNER', uniformNumber: 84, teamCode: 'LV', position: 'WR', skinTone: '#523318' },
    { athleteId: '4432665', displayName: 'Brock Bowers', shortName: 'BOWERS', uniformNumber: 89, teamCode: 'LV', position: 'TE', skinTone: '#f8d9b6' },
  ],
  MIA: [
    { athleteId: '4241479', displayName: 'Tua Tagovailoa', shortName: 'TAGOVAILOA', uniformNumber: 1, teamCode: 'MIA', position: 'QB', skinTone: '#c68642' },
    { athleteId: '4426515', displayName: "De'Von Achane", shortName: 'ACHANE', uniformNumber: 28, teamCode: 'MIA', position: 'RB', skinTone: '#523318' },
    { athleteId: 'mia_31_raheemmostert', displayName: 'Raheem Mostert', shortName: 'MOSTERT', uniformNumber: 31, teamCode: 'MIA', position: 'RB', skinTone: '#8d5524' },
    { athleteId: '3116406', displayName: 'Tyreek Hill', shortName: 'HILL', uniformNumber: 10, teamCode: 'MIA', position: 'WR', skinTone: '#523318' },
    { athleteId: '4372016', displayName: 'Jaylen Waddle', shortName: 'WADDLE', uniformNumber: 17, teamCode: 'MIA', position: 'WR', skinTone: '#523318' },
    { athleteId: '16733', displayName: 'Odell Beckham Jr.', shortName: 'BECKHAM', uniformNumber: 13, teamCode: 'MIA', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '3054212', displayName: 'Jonnu Smith', shortName: 'SMITH', uniformNumber: 18, teamCode: 'MIA', position: 'TE', skinTone: '#523318' },
  ],
  MIN: [
    { athleteId: '3912547', displayName: 'Sam Darnold', shortName: 'DARNOLD', uniformNumber: 14, teamCode: 'MIN', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '3042519', displayName: 'Aaron Jones', shortName: 'JONES', uniformNumber: 33, teamCode: 'MIN', position: 'RB', skinTone: '#523318' },
    { athleteId: '4242431', displayName: 'Ty Chandler', shortName: 'CHANDLER', uniformNumber: 32, teamCode: 'MIN', position: 'RB', skinTone: '#523318' },
    { athleteId: '4262921', displayName: 'Justin Jefferson', shortName: 'JEFFERSON', uniformNumber: 18, teamCode: 'MIN', position: 'WR', skinTone: '#523318' },
    { athleteId: '4429205', displayName: 'Jordan Addison', shortName: 'ADDISON', uniformNumber: 3, teamCode: 'MIN', position: 'WR', skinTone: '#523318' },
    { athleteId: '4382466', displayName: 'Jalen Nailor', shortName: 'NAILOR', uniformNumber: 9, teamCode: 'MIN', position: 'WR', skinTone: '#523318' },
    { athleteId: '4036133', displayName: 'T.J. Hockenson', shortName: 'HOCKENSON', uniformNumber: 87, teamCode: 'MIN', position: 'TE', skinTone: '#f8d9b6' },
  ],
  NE: [
    { athleteId: '4431452', displayName: 'Drake Maye', shortName: 'MAYE', uniformNumber: 10, teamCode: 'NE', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4569173', displayName: 'Rhamondre Stevenson', shortName: 'STEVENSON', uniformNumber: 38, teamCode: 'NE', position: 'RB', skinTone: '#523318' },
    { athleteId: 'ne_4_antoniogibson', displayName: 'Antonio Gibson', shortName: 'GIBSON', uniformNumber: 4, teamCode: 'NE', position: 'RB', skinTone: '#523318' },
    { athleteId: '4427095', displayName: 'DeMario Douglas', shortName: 'DOUGLAS', uniformNumber: 3, teamCode: 'NE', position: 'WR', skinTone: '#523318' },
    { athleteId: '3045523', displayName: 'Kendrick Bourne', shortName: 'BOURNE', uniformNumber: 17, teamCode: 'NE', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4429022', displayName: 'Kayshon Boutte', shortName: 'BOUTTE', uniformNumber: 14, teamCode: 'NE', position: 'WR', skinTone: '#523318' },
    { athleteId: '3046439', displayName: 'Hunter Henry', shortName: 'HENRY', uniformNumber: 85, teamCode: 'NE', position: 'TE', skinTone: '#f8d9b6' },
  ],
  NO: [
    { athleteId: '16757', displayName: 'Derek Carr', shortName: 'CARR', uniformNumber: 4, teamCode: 'NO', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '3054850', displayName: 'Alvin Kamara', shortName: 'KAMARA', uniformNumber: 41, teamCode: 'NO', position: 'RB', skinTone: '#523318' },
    { athleteId: '3051392', displayName: 'Jamaal Williams', shortName: 'WILLIAMS', uniformNumber: 5, teamCode: 'NO', position: 'RB', skinTone: '#523318' },
    { athleteId: '4361370', displayName: 'Chris Olave', shortName: 'OLAVE', uniformNumber: 12, teamCode: 'NO', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4032473', displayName: 'Rashid Shaheed', shortName: 'SHAHEED', uniformNumber: 22, teamCode: 'NO', position: 'WR', skinTone: '#523318' },
    { athleteId: 'no_11_cedrickwilsonjr', displayName: 'Cedrick Wilson Jr.', shortName: 'WILSON', uniformNumber: 11, teamCode: 'NO', position: 'WR', skinTone: '#523318' },
    { athleteId: '3929645', displayName: 'Juwan Johnson', shortName: 'JOHNSON', uniformNumber: 83, teamCode: 'NO', position: 'TE', skinTone: '#523318' },
    { athleteId: '15967', displayName: 'Taysom Hill', shortName: 'HILL', uniformNumber: 7, teamCode: 'NO', position: 'TE', skinTone: '#f8d9b6' },
  ],
  NYG: [
    { athleteId: '3917792', displayName: 'Daniel Jones', shortName: 'JONES', uniformNumber: 17, teamCode: 'NYG', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4040761', displayName: 'Devin Singletary', shortName: 'SINGLETARY', uniformNumber: 26, teamCode: 'NYG', position: 'RB', skinTone: '#523318' },
    { athleteId: '4360516', displayName: 'Tyrone Tracy Jr.', shortName: 'TRACY JR', uniformNumber: 29, teamCode: 'NYG', position: 'RB', skinTone: '#523318' },
    { athleteId: '4595348', displayName: 'Malik Nabers', shortName: 'NABERS', uniformNumber: 1, teamCode: 'NYG', position: 'WR', skinTone: '#523318' },
    { athleteId: '4426515', displayName: "Wan'Dale Robinson", shortName: 'ROBINSON', uniformNumber: 17, teamCode: 'NYG', position: 'WR', skinTone: '#523318' },
    { athleteId: 'nyg_86_dariusslayton', displayName: 'Darius Slayton', shortName: 'SLAYTON', uniformNumber: 86, teamCode: 'NYG', position: 'WR', skinTone: '#523318' },
    { athleteId: '4429148', displayName: 'Theo Johnson', shortName: 'JOHNSON', uniformNumber: 84, teamCode: 'NYG', position: 'TE', skinTone: '#c68642' },
  ],
  NYJ: [
    { athleteId: '8439', displayName: 'Aaron Rodgers', shortName: 'RODGERS', uniformNumber: 8, teamCode: 'NYJ', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4427366', displayName: 'Breece Hall', shortName: 'HALL', uniformNumber: 20, teamCode: 'NYJ', position: 'RB', skinTone: '#523318' },
    { athleteId: '4685247', displayName: 'Braelon Allen', shortName: 'ALLEN', uniformNumber: 0, teamCode: 'NYJ', position: 'RB', skinTone: '#523318' },
    { athleteId: '4569618', displayName: 'Garrett Wilson', shortName: 'WILSON', uniformNumber: 5, teamCode: 'NYJ', position: 'WR', skinTone: '#523318' },
    { athleteId: '16800', displayName: 'Davante Adams', shortName: 'ADAMS', uniformNumber: 17, teamCode: 'NYJ', position: 'WR', skinTone: '#523318' },
    { athleteId: 'nyj_10_allenlazard', displayName: 'Allen Lazard', shortName: 'LAZARD', uniformNumber: 10, teamCode: 'NYJ', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '3915486', displayName: 'Tyler Conklin', shortName: 'CONKLIN', uniformNumber: 83, teamCode: 'NYJ', position: 'TE', skinTone: '#f8d9b6' },
  ],
  PHI: [
    { athleteId: '4040715', displayName: 'Jalen Hurts', shortName: 'HURTS', uniformNumber: 1, teamCode: 'PHI', position: 'QB', skinTone: '#8d5524' },
    { athleteId: '3929630', displayName: 'Saquon Barkley', shortName: 'BARKLEY', uniformNumber: 26, teamCode: 'PHI', position: 'RB', skinTone: '#523318' },
    { athleteId: 'phi_14_kennethgainwell', displayName: 'Kenneth Gainwell', shortName: 'GAINWELL', uniformNumber: 14, teamCode: 'PHI', position: 'RB', skinTone: '#523318' },
    { athleteId: '4047646', displayName: 'A.J. Brown', shortName: 'BROWN', uniformNumber: 1, teamCode: 'PHI', position: 'WR', skinTone: '#523318' },
    { athleteId: '4241478', displayName: 'DeVonta Smith', shortName: 'SMITH', uniformNumber: 6, teamCode: 'PHI', position: 'WR', skinTone: '#523318' },
    { athleteId: '4361409', displayName: 'Jahan Dotson', shortName: 'DOTSON', uniformNumber: 4, teamCode: 'PHI', position: 'WR', skinTone: '#523318' },
    { athleteId: '3121023', displayName: 'Dallas Goedert', shortName: 'GOEDERT', uniformNumber: 88, teamCode: 'PHI', position: 'TE', skinTone: '#f8d9b6' },
  ],
  PIT: [
    { athleteId: '14881', displayName: 'Russell Wilson', shortName: 'WILSON', uniformNumber: 3, teamCode: 'PIT', position: 'QB', skinTone: '#8d5524' },
    { athleteId: '4241457', displayName: 'Najee Harris', shortName: 'HARRIS', uniformNumber: 23, teamCode: 'PIT', position: 'RB', skinTone: '#523318' },
    { athleteId: '4569987', displayName: 'Jaylen Warren', shortName: 'WARREN', uniformNumber: 30, teamCode: 'PIT', position: 'RB', skinTone: '#523318' },
    { athleteId: '4426354', displayName: 'George Pickens', shortName: 'PICKENS', uniformNumber: 3, teamCode: 'PIT', position: 'WR', skinTone: '#523318' },
    { athleteId: '3930066', displayName: 'Van Jefferson', shortName: 'JEFFERSON', uniformNumber: 12, teamCode: 'PIT', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4243389', displayName: 'Calvin Austin III', shortName: 'AUSTIN', uniformNumber: 82, teamCode: 'PIT', position: 'WR', skinTone: '#523318' },
    { athleteId: '4361411', displayName: 'Pat Freiermuth', shortName: 'FREIERMUTH', uniformNumber: 88, teamCode: 'PIT', position: 'TE', skinTone: '#f8d9b6' },
  ],
  SEA: [
    { athleteId: '15864', displayName: 'Geno Smith', shortName: 'SMITH', uniformNumber: 7, teamCode: 'SEA', position: 'QB', skinTone: '#523318' },
    { athleteId: '4567048', displayName: 'Kenneth Walker III', shortName: 'WALKER', uniformNumber: 9, teamCode: 'SEA', position: 'RB', skinTone: '#523318' },
    { athleteId: '4426385', displayName: 'Zach Charbonnet', shortName: 'CHARBONNET', uniformNumber: 26, teamCode: 'SEA', position: 'RB', skinTone: '#c68642' },
    { athleteId: '4047650', displayName: 'DK Metcalf', shortName: 'METCALF', uniformNumber: 4, teamCode: 'SEA', position: 'WR', skinTone: '#523318' },
    { athleteId: '16790', displayName: 'Tyler Lockett', shortName: 'LOCKETT', uniformNumber: 16, teamCode: 'SEA', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4430878', displayName: 'Jaxon Smith-Njigba', shortName: 'SMITH-NJIGBA', uniformNumber: 11, teamCode: 'SEA', position: 'WR', skinTone: '#523318' },
    { athleteId: '4036131', displayName: 'Noah Fant', shortName: 'FANT', uniformNumber: 87, teamCode: 'SEA', position: 'TE', skinTone: '#523318' },
  ],
  SF: [
    { athleteId: '4361741', displayName: 'Brock Purdy', shortName: 'PURDY', uniformNumber: 13, teamCode: 'SF', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '3117251', displayName: 'Christian McCaffrey', shortName: 'MCCAFFREY', uniformNumber: 23, teamCode: 'SF', position: 'RB', skinTone: '#f8d9b6' },
    { athleteId: '4360569', displayName: 'Jordan Mason', shortName: 'MASON', uniformNumber: 27, teamCode: 'SF', position: 'RB', skinTone: '#523318' },
    { athleteId: 'sf_1_deebosamuel', displayName: 'Deebo Samuel', shortName: 'SAMUEL', uniformNumber: 1, teamCode: 'SF', position: 'WR', skinTone: '#523318' },
    { athleteId: '3886598', displayName: 'Jauan Jennings', shortName: 'JENNINGS', uniformNumber: 14, teamCode: 'SF', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4428209', displayName: 'Ricky Pearsall', shortName: 'PEARSALL', uniformNumber: 1, teamCode: 'SF', position: 'WR', skinTone: '#f8d9b6' },
    { athleteId: '3040151', displayName: 'George Kittle', shortName: 'KITTLE', uniformNumber: 85, teamCode: 'SF', position: 'TE', skinTone: '#f8d9b6' },
  ],
  TB: [
    { athleteId: '3052587', displayName: 'Baker Mayfield', shortName: 'MAYFIELD', uniformNumber: 6, teamCode: 'TB', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4596448', displayName: 'Bucky Irving', shortName: 'IRVING', uniformNumber: 7, teamCode: 'TB', position: 'RB', skinTone: '#523318' },
    { athleteId: '4697815', displayName: 'Rachaad White', shortName: 'WHITE', uniformNumber: 1, teamCode: 'TB', position: 'RB', skinTone: '#523318' },
    { athleteId: '16737', displayName: 'Mike Evans', shortName: 'EVANS', uniformNumber: 5, teamCode: 'TB', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '3116165', displayName: 'Chris Godwin', shortName: 'GODWIN', uniformNumber: 14, teamCode: 'TB', position: 'WR', skinTone: '#523318' },
    { athleteId: '4430834', displayName: 'Jalen McMillan', shortName: 'MCMILLAN', uniformNumber: 11, teamCode: 'TB', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4243331', displayName: 'Cade Otton', shortName: 'OTTON', uniformNumber: 88, teamCode: 'TB', position: 'TE', skinTone: '#f8d9b6' },
  ],
  TEN: [
    { athleteId: 'ten_8_willlevis', displayName: 'Will Levis', shortName: 'LEVIS', uniformNumber: 8, teamCode: 'TEN', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '3916148', displayName: 'Tony Pollard', shortName: 'POLLARD', uniformNumber: 20, teamCode: 'TEN', position: 'RB', skinTone: '#523318' },
    { athleteId: '4428557', displayName: 'Tyjae Spears', shortName: 'SPEARS', uniformNumber: 2, teamCode: 'TEN', position: 'RB', skinTone: '#523318' },
    { athleteId: '3925357', displayName: 'Calvin Ridley', shortName: 'RIDLEY', uniformNumber: 0, teamCode: 'TEN', position: 'WR', skinTone: '#523318' },
    { athleteId: '3929785', displayName: 'Nick Westbrook-Ikhine', shortName: 'WESTBROOK', uniformNumber: 12, teamCode: 'TEN', position: 'WR', skinTone: '#523318' },
    { athleteId: '3045144', displayName: 'Tyler Boyd', shortName: 'BOYD', uniformNumber: 83, teamCode: 'TEN', position: 'WR', skinTone: '#523318' },
    { athleteId: '4360635', displayName: 'Chig Okonkwo', shortName: 'OKONKWO', uniformNumber: 85, teamCode: 'TEN', position: 'TE', skinTone: '#523318' },
  ],
  WSH: [
    { athleteId: '4426348', displayName: 'Jayden Daniels', shortName: 'DANIELS', uniformNumber: 5, teamCode: 'WSH', position: 'QB', skinTone: '#523318' },
    { athleteId: '4241474', displayName: 'Brian Robinson Jr.', shortName: 'ROBINSON JR', uniformNumber: 15, teamCode: 'WSH', position: 'RB', skinTone: '#523318' },
    { athleteId: '3068267', displayName: 'Austin Ekeler', shortName: 'EKELER', uniformNumber: 30, teamCode: 'WSH', position: 'RB', skinTone: '#8d5524' },
    { athleteId: 'wsh_17_terrymclaurin', displayName: 'Terry McLaurin', shortName: 'MCLAURIN', uniformNumber: 17, teamCode: 'WSH', position: 'WR', skinTone: '#523318' },
    { athleteId: 'wsh_85_noahbrown', displayName: 'Noah Brown', shortName: 'BROWN', uniformNumber: 85, teamCode: 'WSH', position: 'WR', skinTone: '#523318' },
    { athleteId: '4426948', displayName: 'Luke McCaffrey', shortName: 'MCCAFFREY', uniformNumber: 11, teamCode: 'WSH', position: 'WR', skinTone: '#f8d9b6' },
    { athleteId: '15835', displayName: 'Zach Ertz', shortName: 'ERTZ', uniformNumber: 86, teamCode: 'WSH', position: 'TE', skinTone: '#f8d9b6' },
  ],
};

/**
 * Hard validation assertion:
 * Confirms that a team roster contains at least:
 * - 1 QB
 * - 2 RBs
 * - 2 WRs
 * - 1 TE
 * Total minimum 6 players!
 */
export function validateTeamRoster(teamCode: string, players: { position: string }[]): boolean {
  const qbs = players.filter((p) => p.position === 'QB');
  const rbs = players.filter((p) => p.position === 'RB');
  const wrs = players.filter((p) => p.position === 'WR');
  const tes = players.filter((p) => p.position === 'TE');

  if (qbs.length < 1 || rbs.length < 2 || wrs.length < 2 || tes.length < 1) {
    throw new Error(
      `Data Integrity Failed: ${teamCode} is missing core starters! Found: QB=${qbs.length}, RB=${rbs.length}, WR=${wrs.length}, TE=${tes.length}`
    );
  }
  return true;
}
