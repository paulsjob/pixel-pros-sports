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
    { athleteId: '4241479', displayName: 'Kyler Murray', shortName: 'MURRAY', uniformNumber: 1, teamCode: 'ARI', position: 'QB', skinTone: '#e0ac69' },
    { athleteId: '3045147', displayName: 'James Conner', shortName: 'CONNER', uniformNumber: 6, teamCode: 'ARI', position: 'RB', skinTone: '#c68642' },
    { athleteId: '4430155', displayName: 'Trey Benson', shortName: 'BENSON', uniformNumber: 33, teamCode: 'ARI', position: 'RB', skinTone: '#8d5524' },
    { athleteId: '4432708', displayName: 'Marvin Harrison Jr.', shortName: 'HARRISON JR', uniformNumber: 18, teamCode: 'ARI', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4361579', displayName: 'Michael Wilson', shortName: 'WILSON', uniformNumber: 14, teamCode: 'ARI', position: 'WR', skinTone: '#c68642' },
    { athleteId: '4038941', displayName: 'Greg Dortch', shortName: 'DORTCH', uniformNumber: 4, teamCode: 'ARI', position: 'WR', skinTone: '#523318' },
    { athleteId: '4361307', displayName: 'Trey McBride', shortName: 'MCBRIDE', uniformNumber: 85, teamCode: 'ARI', position: 'TE', skinTone: '#f8d9b6' },
  ],
  ATL: [
    { athleteId: '14880', displayName: 'Kirk Cousins', shortName: 'COUSINS', uniformNumber: 18, teamCode: 'ATL', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4430807', displayName: 'Bijan Robinson', shortName: 'ROBINSON', uniformNumber: 7, teamCode: 'ATL', position: 'RB', skinTone: '#523318' },
    { athleteId: '4361421', displayName: 'Tyler Allgeier', shortName: 'ALLGEIER', uniformNumber: 25, teamCode: 'ATL', position: 'RB', skinTone: '#8d5524' },
    { athleteId: '4426502', displayName: 'Drake London', shortName: 'LONDON', uniformNumber: 5, teamCode: 'ATL', position: 'WR', skinTone: '#c68642' },
    { athleteId: '4241389', displayName: 'Darnell Mooney', shortName: 'MOONEY', uniformNumber: 1, teamCode: 'ATL', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '2976535', displayName: 'Ray-Ray McCloud III', shortName: 'MCCLOUD', uniformNumber: 34, teamCode: 'ATL', position: 'WR', skinTone: '#523318' },
    { athleteId: '4360248', displayName: 'Kyle Pitts', shortName: 'PITTS', uniformNumber: 8, teamCode: 'ATL', position: 'TE', skinTone: '#8d5524' },
  ],
  BAL: [
    { athleteId: '3916387', displayName: 'Lamar Jackson', shortName: 'JACKSON', uniformNumber: 8, teamCode: 'BAL', position: 'QB', skinTone: '#523318' },
    { athleteId: '3043078', displayName: 'Derrick Henry', shortName: 'HENRY', uniformNumber: 22, teamCode: 'BAL', position: 'RB', skinTone: '#523318' },
    { athleteId: '4038817', displayName: 'Justice Hill', shortName: 'HILL', uniformNumber: 43, teamCode: 'BAL', position: 'RB', skinTone: '#8d5524' },
    { athleteId: '4428986', displayName: 'Zay Flowers', shortName: 'FLOWERS', uniformNumber: 4, teamCode: 'BAL', position: 'WR', skinTone: '#523318' },
    { athleteId: '4360436', displayName: 'Rashod Bateman', shortName: 'BATEMAN', uniformNumber: 7, teamCode: 'BAL', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '2576434', displayName: 'Nelson Agholor', shortName: 'AGHOLOR', uniformNumber: 15, teamCode: 'BAL', position: 'WR', skinTone: '#523318' },
    { athleteId: '3116365', displayName: 'Mark Andrews', shortName: 'ANDREWS', uniformNumber: 89, teamCode: 'BAL', position: 'TE', skinTone: '#f8d9b6' },
    { athleteId: '4426515', displayName: 'Isaiah Likely', shortName: 'LIKELY', uniformNumber: 80, teamCode: 'BAL', position: 'TE', skinTone: '#523318' },
  ],
  BUF: [
    { athleteId: '3918298', displayName: 'Josh Allen', shortName: 'ALLEN', uniformNumber: 17, teamCode: 'BUF', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4362628', displayName: 'James Cook', shortName: 'COOK', uniformNumber: 4, teamCode: 'BUF', position: 'RB', skinTone: '#523318' },
    { athleteId: '4429013', displayName: 'Ray Davis', shortName: 'DAVIS', uniformNumber: 22, teamCode: 'BUF', position: 'RB', skinTone: '#8d5524' },
    { athleteId: '4360699', displayName: 'Khalil Shakir', shortName: 'SHAKIR', uniformNumber: 10, teamCode: 'BUF', position: 'WR', skinTone: '#c68642' },
    { athleteId: '4431448', displayName: 'Keon Coleman', shortName: 'COLEMAN', uniformNumber: 0, teamCode: 'BUF', position: 'WR', skinTone: '#523318' },
    { athleteId: '3116163', displayName: 'Curtis Samuel', shortName: 'SAMUEL', uniformNumber: 1, teamCode: 'BUF', position: 'WR', skinTone: '#523318' },
    { athleteId: '4426514', displayName: 'Dalton Kincaid', shortName: 'KINCAID', uniformNumber: 86, teamCode: 'BUF', position: 'TE', skinTone: '#f8d9b6' },
    { athleteId: '3123869', displayName: 'Dawson Knox', shortName: 'KNOX', uniformNumber: 88, teamCode: 'BUF', position: 'TE', skinTone: '#f8d9b6' },
  ],
  CAR: [
    { athleteId: '4685701', displayName: 'Bryce Young', shortName: 'YOUNG', uniformNumber: 9, teamCode: 'CAR', position: 'QB', skinTone: '#8d5524' },
    { athleteId: '4241416', displayName: 'Chuba Hubbard', shortName: 'HUBBARD', uniformNumber: 30, teamCode: 'CAR', position: 'RB', skinTone: '#523318' },
    { athleteId: '4035687', displayName: 'Miles Sanders', shortName: 'SANDERS', uniformNumber: 6, teamCode: 'CAR', position: 'RB', skinTone: '#523318' },
    { athleteId: '3916433', displayName: 'Diontae Johnson', shortName: 'JOHNSON', uniformNumber: 5, teamCode: 'CAR', position: 'WR', skinTone: '#523318' },
    { athleteId: '4427403', displayName: 'Xavier Legette', shortName: 'LEGETTE', uniformNumber: 17, teamCode: 'CAR', position: 'WR', skinTone: '#523318' },
    { athleteId: '4576356', displayName: 'Jalen Coker', shortName: 'COKER', uniformNumber: 18, teamCode: 'CAR', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '15818', displayName: 'Adam Thielen', shortName: 'THIELEN', uniformNumber: 19, teamCode: 'CAR', position: 'WR', skinTone: '#f8d9b6' },
    { athleteId: '4432709', displayName: "Ja'Tavion Sanders", shortName: 'SANDERS', uniformNumber: 85, teamCode: 'CAR', position: 'TE', skinTone: '#523318' },
    { athleteId: '4360310', displayName: 'Tommy Tremble', shortName: 'TREMBLE', uniformNumber: 82, teamCode: 'CAR', position: 'TE', skinTone: '#8d5524' },
  ],
  CHI: [
    { athleteId: '4431611', displayName: 'Caleb Williams', shortName: 'WILLIAMS', uniformNumber: 18, teamCode: 'CHI', position: 'QB', skinTone: '#8d5524' },
    { athleteId: '4259545', displayName: "D'Andre Swift", shortName: 'SWIFT', uniformNumber: 4, teamCode: 'CHI', position: 'RB', skinTone: '#523318' },
    { athleteId: '4427366', displayName: 'Roschon Johnson', shortName: 'JOHNSON', uniformNumber: 23, teamCode: 'CHI', position: 'RB', skinTone: '#523318' },
    { athleteId: '3915416', displayName: 'DJ Moore', shortName: 'MOORE', uniformNumber: 2, teamCode: 'CHI', position: 'WR', skinTone: '#523318' },
    { athleteId: '15818', displayName: 'Keenan Allen', shortName: 'ALLEN', uniformNumber: 13, teamCode: 'CHI', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4430878', displayName: 'Rome Odunze', shortName: 'ODUNZE', uniformNumber: 15, teamCode: 'CHI', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4242540', displayName: 'Cole Kmet', shortName: 'KMET', uniformNumber: 85, teamCode: 'CHI', position: 'TE', skinTone: '#f8d9b6' },
  ],
  CIN: [
    { athleteId: '3915511', displayName: 'Joe Burrow', shortName: 'BURROW', uniformNumber: 9, teamCode: 'CIN', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4035676', displayName: 'Zack Moss', shortName: 'MOSS', uniformNumber: 31, teamCode: 'CIN', position: 'RB', skinTone: '#523318' },
    { athleteId: '4427361', displayName: 'Chase Brown', shortName: 'BROWN', uniformNumber: 30, teamCode: 'CIN', position: 'RB', skinTone: '#8d5524' },
    { athleteId: '4362628', displayName: "Ja'Marr Chase", shortName: 'CHASE', uniformNumber: 1, teamCode: 'CIN', position: 'WR', skinTone: '#523318' },
    { athleteId: '4239993', displayName: 'Tee Higgins', shortName: 'HIGGINS', uniformNumber: 5, teamCode: 'CIN', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4426519', displayName: 'Andrei Iosivas', shortName: 'IOSIVAS', uniformNumber: 80, teamCode: 'CIN', position: 'WR', skinTone: '#c68642' },
    { athleteId: '3116164', displayName: 'Mike Gesicki', shortName: 'GESICKI', uniformNumber: 88, teamCode: 'CIN', position: 'TE', skinTone: '#f8d9b6' },
  ],
  CLE: [
    { athleteId: '3122840', displayName: 'Deshaun Watson', shortName: 'WATSON', uniformNumber: 4, teamCode: 'CLE', position: 'QB', skinTone: '#523318' },
    { athleteId: '4360311', displayName: 'Jerome Ford', shortName: 'FORD', uniformNumber: 34, teamCode: 'CLE', position: 'RB', skinTone: '#523318' },
    { athleteId: '3128720', displayName: 'Nick Chubb', shortName: 'CHUBB', uniformNumber: 24, teamCode: 'CLE', position: 'RB', skinTone: '#523318' },
    { athleteId: '4241463', displayName: 'Jerry Jeudy', shortName: 'JEUDY', uniformNumber: 3, teamCode: 'CLE', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4426511', displayName: 'Cedric Tillman', shortName: 'TILLMAN', uniformNumber: 19, teamCode: 'CLE', position: 'WR', skinTone: '#523318' },
    { athleteId: '4360930', displayName: 'Elijah Moore', shortName: 'MOORE', uniformNumber: 8, teamCode: 'CLE', position: 'WR', skinTone: '#523318' },
    { athleteId: '3123075', displayName: 'David Njoku', shortName: 'NJOKU', uniformNumber: 85, teamCode: 'CLE', position: 'TE', skinTone: '#523318' },
  ],
  DAL: [
    { athleteId: '2577417', displayName: 'Dak Prescott', shortName: 'PRESCOTT', uniformNumber: 4, teamCode: 'DAL', position: 'QB', skinTone: '#8d5524' },
    { athleteId: '4361811', displayName: 'Rico Dowdle', shortName: 'DOWDLE', uniformNumber: 23, teamCode: 'DAL', position: 'RB', skinTone: '#523318' },
    { athleteId: '3059915', displayName: 'Ezekiel Elliott', shortName: 'ELLIOTT', uniformNumber: 15, teamCode: 'DAL', position: 'RB', skinTone: '#523318' },
    { athleteId: '4241389', displayName: 'CeeDee Lamb', shortName: 'LAMB', uniformNumber: 88, teamCode: 'DAL', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '16725', displayName: 'Brandin Cooks', shortName: 'COOKS', uniformNumber: 3, teamCode: 'DAL', position: 'WR', skinTone: '#523318' },
    { athleteId: '4362111', displayName: 'Jalen Tolbert', shortName: 'TOLBERT', uniformNumber: 1, teamCode: 'DAL', position: 'WR', skinTone: '#523318' },
    { athleteId: '4240763', displayName: 'Jake Ferguson', shortName: 'FERGUSON', uniformNumber: 87, teamCode: 'DAL', position: 'TE', skinTone: '#f8d9b6' },
  ],
  DEN: [
    { athleteId: '4426338', displayName: 'Bo Nix', shortName: 'NIX', uniformNumber: 10, teamCode: 'DEN', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4361529', displayName: 'Javonte Williams', shortName: 'WILLIAMS', uniformNumber: 33, teamCode: 'DEN', position: 'RB', skinTone: '#523318' },
    { athleteId: '4360333', displayName: 'Jaleel McLaughlin', shortName: 'MCLAUGHLIN', uniformNumber: 38, teamCode: 'DEN', position: 'RB', skinTone: '#523318' },
    { athleteId: '3128429', displayName: 'Courtland Sutton', shortName: 'SUTTON', uniformNumber: 14, teamCode: 'DEN', position: 'WR', skinTone: '#523318' },
    { athleteId: '4430037', displayName: 'Troy Franklin', shortName: 'FRANKLIN', uniformNumber: 16, teamCode: 'DEN', position: 'WR', skinTone: '#523318' },
    { athleteId: '4036125', displayName: "Lil'Jordan Humphrey", shortName: 'HUMPHREY', uniformNumber: 84, teamCode: 'DEN', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4361405', displayName: 'Greg Dulcich', shortName: 'DULCICH', uniformNumber: 80, teamCode: 'DEN', position: 'TE', skinTone: '#f8d9b6' },
  ],
  DET: [
    { athleteId: '3046779', displayName: 'Jared Goff', shortName: 'GOFF', uniformNumber: 16, teamCode: 'DET', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4430737', displayName: 'Jahmyr Gibbs', shortName: 'GIBBS', uniformNumber: 26, teamCode: 'DET', position: 'RB', skinTone: '#523318' },
    { athleteId: '4035538', displayName: 'David Montgomery', shortName: 'MONTGOMERY', uniformNumber: 5, teamCode: 'DET', position: 'RB', skinTone: '#523318' },
    { athleteId: '4374302', displayName: 'Amon-Ra St. Brown', shortName: 'ST. BROWN', uniformNumber: 14, teamCode: 'DET', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4426515', displayName: 'Jameson Williams', shortName: 'WILLIAMS', uniformNumber: 9, teamCode: 'DET', position: 'WR', skinTone: '#523318' },
    { athleteId: '2980148', displayName: 'Kalif Raymond', shortName: 'RAYMOND', uniformNumber: 11, teamCode: 'DET', position: 'WR', skinTone: '#523318' },
    { athleteId: '4430027', displayName: 'Sam LaPorta', shortName: 'LAPORTA', uniformNumber: 87, teamCode: 'DET', position: 'TE', skinTone: '#f8d9b6' },
  ],
  GB: [
    { athleteId: '4036378', displayName: 'Jordan Love', shortName: 'LOVE', uniformNumber: 10, teamCode: 'GB', position: 'QB', skinTone: '#8d5524' },
    { athleteId: '4047365', displayName: 'Josh Jacobs', shortName: 'JACOBS', uniformNumber: 8, teamCode: 'GB', position: 'RB', skinTone: '#523318' },
    { athleteId: '4426519', displayName: 'Emanuel Wilson', shortName: 'WILSON', uniformNumber: 31, teamCode: 'GB', position: 'RB', skinTone: '#523318' },
    { athleteId: '4360932', displayName: 'Jayden Reed', shortName: 'REED', uniformNumber: 11, teamCode: 'GB', position: 'WR', skinTone: '#523318' },
    { athleteId: '4361424', displayName: 'Romeo Doubs', shortName: 'DOUBS', uniformNumber: 87, teamCode: 'GB', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4241464', displayName: 'Christian Watson', shortName: 'WATSON', uniformNumber: 9, teamCode: 'GB', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4426514', displayName: 'Tucker Kraft', shortName: 'KRAFT', uniformNumber: 85, teamCode: 'GB', position: 'TE', skinTone: '#f8d9b6' },
  ],
  HOU: [
    { athleteId: '4432577', displayName: 'C.J. Stroud', shortName: 'STROUD', uniformNumber: 7, teamCode: 'HOU', position: 'QB', skinTone: '#8d5524' },
    { athleteId: '3116385', displayName: 'Joe Mixon', shortName: 'MIXON', uniformNumber: 28, teamCode: 'HOU', position: 'RB', skinTone: '#523318' },
    { athleteId: '4240022', displayName: 'Cam Akers', shortName: 'AKERS', uniformNumber: 22, teamCode: 'HOU', position: 'RB', skinTone: '#523318' },
    { athleteId: '4241474', displayName: 'Nico Collins', shortName: 'COLLINS', uniformNumber: 12, teamCode: 'HOU', position: 'WR', skinTone: '#523318' },
    { athleteId: '2976212', displayName: 'Stefon Diggs', shortName: 'DIGGS', uniformNumber: 1, teamCode: 'HOU', position: 'WR', skinTone: '#523318' },
    { athleteId: '4426515', displayName: 'Tank Dell', shortName: 'DELL', uniformNumber: 3, teamCode: 'HOU', position: 'WR', skinTone: '#523318' },
    { athleteId: '3116389', displayName: 'Dalton Schultz', shortName: 'SCHULTZ', uniformNumber: 86, teamCode: 'HOU', position: 'TE', skinTone: '#f8d9b6' },
  ],
  IND: [
    { athleteId: '4431520', displayName: 'Anthony Richardson', shortName: 'RICHARDSON', uniformNumber: 5, teamCode: 'IND', position: 'QB', skinTone: '#523318' },
    { athleteId: '4242335', displayName: 'Jonathan Taylor', shortName: 'TAYLOR', uniformNumber: 28, teamCode: 'IND', position: 'RB', skinTone: '#523318' },
    { athleteId: '4240051', displayName: 'Trey Sermon', shortName: 'SERMON', uniformNumber: 27, teamCode: 'IND', position: 'RB', skinTone: '#523318' },
    { athleteId: '4035687', displayName: 'Michael Pittman Jr.', shortName: 'PITTMAN', uniformNumber: 11, teamCode: 'IND', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4360244', displayName: 'Alec Pierce', shortName: 'PIERCE', uniformNumber: 14, teamCode: 'IND', position: 'WR', skinTone: '#f8d9b6' },
    { athleteId: '4426354', displayName: 'Josh Downs', shortName: 'DOWNS', uniformNumber: 1, teamCode: 'IND', position: 'WR', skinTone: '#523318' },
    { athleteId: '4035689', displayName: 'Kylen Granson', shortName: 'GRANSON', uniformNumber: 83, teamCode: 'IND', position: 'TE', skinTone: '#8d5524' },
  ],
  JAX: [
    { athleteId: '4360310', displayName: 'Trevor Lawrence', shortName: 'LAWRENCE', uniformNumber: 16, teamCode: 'JAX', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4241470', displayName: 'Travis Etienne Jr.', shortName: 'ETIENNE', uniformNumber: 1, teamCode: 'JAX', position: 'RB', skinTone: '#523318' },
    { athleteId: '4426515', displayName: 'Tank Bigsby', shortName: 'BIGSBY', uniformNumber: 4, teamCode: 'JAX', position: 'RB', skinTone: '#523318' },
    { athleteId: '4432708', displayName: 'Brian Thomas Jr.', shortName: 'THOMAS JR', uniformNumber: 7, teamCode: 'JAX', position: 'WR', skinTone: '#523318' },
    { athleteId: '3895856', displayName: 'Christian Kirk', shortName: 'KIRK', uniformNumber: 13, teamCode: 'JAX', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4241389', displayName: 'Gabe Davis', shortName: 'DAVIS', uniformNumber: 0, teamCode: 'JAX', position: 'WR', skinTone: '#523318' },
    { athleteId: '3051876', displayName: 'Evan Engram', shortName: 'ENGRAM', uniformNumber: 17, teamCode: 'JAX', position: 'TE', skinTone: '#8d5524' },
  ],
  KC: [
    { athleteId: '3139477', displayName: 'Patrick Mahomes', shortName: 'MAHOMES', uniformNumber: 15, teamCode: 'KC', position: 'QB', skinTone: '#8d5524' },
    { athleteId: '4361529', displayName: 'Isiah Pacheco', shortName: 'PACHECO', uniformNumber: 10, teamCode: 'KC', position: 'RB', skinTone: '#8d5524' },
    { athleteId: '3059915', displayName: 'Kareem Hunt', shortName: 'HUNT', uniformNumber: 29, teamCode: 'KC', position: 'RB', skinTone: '#523318' },
    { athleteId: '4432709', displayName: 'Xavier Worthy', shortName: 'WORTHY', uniformNumber: 1, teamCode: 'KC', position: 'WR', skinTone: '#523318' },
    { athleteId: '4361307', displayName: 'Rashee Rice', shortName: 'RICE', uniformNumber: 4, teamCode: 'KC', position: 'WR', skinTone: '#523318' },
    { athleteId: '3121422', displayName: 'JuJu Smith-Schuster', shortName: 'SMITH-SCHUSTER', uniformNumber: 9, teamCode: 'KC', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '15847', displayName: 'Travis Kelce', shortName: 'KELCE', uniformNumber: 87, teamCode: 'KC', position: 'TE', skinTone: '#f8d9b6' },
  ],
  LAC: [
    { athleteId: '4038941', displayName: 'Justin Herbert', shortName: 'HERBERT', uniformNumber: 10, teamCode: 'LAC', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4241985', displayName: 'J.K. Dobbins', shortName: 'DOBBINS', uniformNumber: 27, teamCode: 'LAC', position: 'RB', skinTone: '#523318' },
    { athleteId: '3051889', displayName: 'Gus Edwards', shortName: 'EDWARDS', uniformNumber: 4, teamCode: 'LAC', position: 'RB', skinTone: '#523318' },
    { athleteId: '4430155', displayName: 'Ladd McConkey', shortName: 'MCCONKEY', uniformNumber: 15, teamCode: 'LAC', position: 'WR', skinTone: '#f8d9b6' },
    { athleteId: '4426515', displayName: 'Quentin Johnston', shortName: 'JOHNSTON', uniformNumber: 1, teamCode: 'LAC', position: 'WR', skinTone: '#523318' },
    { athleteId: '4038945', displayName: 'Joshua Palmer', shortName: 'PALMER', uniformNumber: 5, teamCode: 'LAC', position: 'WR', skinTone: '#523318' },
    { athleteId: '16775', displayName: 'Will Dissly', shortName: 'DISSLY', uniformNumber: 81, teamCode: 'LAC', position: 'TE', skinTone: '#f8d9b6' },
  ],
  LAR: [
    { athleteId: '12483', displayName: 'Matthew Stafford', shortName: 'STAFFORD', uniformNumber: 9, teamCode: 'LAR', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4426515', displayName: 'Kyren Williams', shortName: 'WILLIAMS', uniformNumber: 23, teamCode: 'LAR', position: 'RB', skinTone: '#523318' },
    { athleteId: '4430807', displayName: 'Blake Corum', shortName: 'CORUM', uniformNumber: 22, teamCode: 'LAR', position: 'RB', skinTone: '#8d5524' },
    { athleteId: '2977644', displayName: 'Cooper Kupp', shortName: 'KUPP', uniformNumber: 10, teamCode: 'LAR', position: 'WR', skinTone: '#f8d9b6' },
    { athleteId: '4426515', displayName: 'Puka Nacua', shortName: 'NACUA', uniformNumber: 17, teamCode: 'LAR', position: 'WR', skinTone: '#c68642' },
    { athleteId: '3045144', displayName: 'Demarcus Robinson', shortName: 'ROBINSON', uniformNumber: 11, teamCode: 'LAR', position: 'WR', skinTone: '#523318' },
    { athleteId: '4038944', displayName: 'Colby Parkinson', shortName: 'PARKINSON', uniformNumber: 84, teamCode: 'LAR', position: 'TE', skinTone: '#f8d9b6' },
  ],
  LV: [
    { athleteId: '4038524', displayName: 'Gardner Minshew', shortName: 'MINSHEW', uniformNumber: 15, teamCode: 'LV', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4035687', displayName: 'Alexander Mattison', shortName: 'MATTISON', uniformNumber: 22, teamCode: 'LV', position: 'RB', skinTone: '#523318' },
    { athleteId: '4361529', displayName: 'Zamir White', shortName: 'WHITE', uniformNumber: 3, teamCode: 'LV', position: 'RB', skinTone: '#523318' },
    { athleteId: '4035689', displayName: 'Jakobi Meyers', shortName: 'MEYERS', uniformNumber: 16, teamCode: 'LV', position: 'WR', skinTone: '#523318' },
    { athleteId: '4426515', displayName: 'Tre Tucker', shortName: 'TUCKER', uniformNumber: 11, teamCode: 'LV', position: 'WR', skinTone: '#523318' },
    { athleteId: '4241389', displayName: 'DJ Turner', shortName: 'TURNER', uniformNumber: 84, teamCode: 'LV', position: 'WR', skinTone: '#523318' },
    { athleteId: '4431712', displayName: 'Brock Bowers', shortName: 'BOWERS', uniformNumber: 89, teamCode: 'LV', position: 'TE', skinTone: '#f8d9b6' },
  ],
  MIA: [
    { athleteId: '4241479', displayName: 'Tua Tagovailoa', shortName: 'TAGOVAILOA', uniformNumber: 1, teamCode: 'MIA', position: 'QB', skinTone: '#c68642' },
    { athleteId: '4426515', displayName: "De'Von Achane", shortName: 'ACHANE', uniformNumber: 28, teamCode: 'MIA', position: 'RB', skinTone: '#523318' },
    { athleteId: '2576434', displayName: 'Raheem Mostert', shortName: 'MOSTERT', uniformNumber: 31, teamCode: 'MIA', position: 'RB', skinTone: '#8d5524' },
    { athleteId: '3116406', displayName: 'Tyreek Hill', shortName: 'HILL', uniformNumber: 10, teamCode: 'MIA', position: 'WR', skinTone: '#523318' },
    { athleteId: '4362628', displayName: 'Jaylen Waddle', shortName: 'WADDLE', uniformNumber: 17, teamCode: 'MIA', position: 'WR', skinTone: '#523318' },
    { athleteId: '16790', displayName: 'Odell Beckham Jr.', shortName: 'BECKHAM', uniformNumber: 3, teamCode: 'MIA', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '3045144', displayName: 'Jonnu Smith', shortName: 'SMITH', uniformNumber: 9, teamCode: 'MIA', position: 'TE', skinTone: '#523318' },
  ],
  MIN: [
    { athleteId: '3912547', displayName: 'Sam Darnold', shortName: 'DARNOLD', uniformNumber: 14, teamCode: 'MIN', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '3042519', displayName: 'Aaron Jones', shortName: 'JONES', uniformNumber: 33, teamCode: 'MIN', position: 'RB', skinTone: '#523318' },
    { athleteId: '4361529', displayName: 'Ty Chandler', shortName: 'CHANDLER', uniformNumber: 24, teamCode: 'MIN', position: 'RB', skinTone: '#523318' },
    { athleteId: '4262921', displayName: 'Justin Jefferson', shortName: 'JEFFERSON', uniformNumber: 18, teamCode: 'MIN', position: 'WR', skinTone: '#523318' },
    { athleteId: '4426515', displayName: 'Jordan Addison', shortName: 'ADDISON', uniformNumber: 3, teamCode: 'MIN', position: 'WR', skinTone: '#523318' },
    { athleteId: '4361424', displayName: 'Jalen Nailor', shortName: 'NAILOR', uniformNumber: 83, teamCode: 'MIN', position: 'WR', skinTone: '#523318' },
    { athleteId: '4035687', displayName: 'T.J. Hockenson', shortName: 'HOCKENSON', uniformNumber: 87, teamCode: 'MIN', position: 'TE', skinTone: '#f8d9b6' },
  ],
  NE: [
    { athleteId: '4431452', displayName: 'Drake Maye', shortName: 'MAYE', uniformNumber: 10, teamCode: 'NE', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4361529', displayName: 'Rhamondre Stevenson', shortName: 'STEVENSON', uniformNumber: 38, teamCode: 'NE', position: 'RB', skinTone: '#523318' },
    { athleteId: '4035687', displayName: 'Antonio Gibson', shortName: 'GIBSON', uniformNumber: 4, teamCode: 'NE', position: 'RB', skinTone: '#523318' },
    { athleteId: '4426515', displayName: 'DeMario Douglas', shortName: 'DOUGLAS', uniformNumber: 3, teamCode: 'NE', position: 'WR', skinTone: '#523318' },
    { athleteId: '3045144', displayName: 'Kendrick Bourne', shortName: 'BOURNE', uniformNumber: 84, teamCode: 'NE', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4430155', displayName: 'Kayshon Boutte', shortName: 'BOUTTE', uniformNumber: 18, teamCode: 'NE', position: 'WR', skinTone: '#523318' },
    { athleteId: '3046439', displayName: 'Hunter Henry', shortName: 'HENRY', uniformNumber: 85, teamCode: 'NE', position: 'TE', skinTone: '#f8d9b6' },
  ],
  NO: [
    { athleteId: '16757', displayName: 'Derek Carr', shortName: 'CARR', uniformNumber: 4, teamCode: 'NO', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '3054850', displayName: 'Alvin Kamara', shortName: 'KAMARA', uniformNumber: 41, teamCode: 'NO', position: 'RB', skinTone: '#523318' },
    { athleteId: '3051392', displayName: 'Jamaal Williams', shortName: 'WILLIAMS', uniformNumber: 5, teamCode: 'NO', position: 'RB', skinTone: '#523318' },
    { athleteId: '4361370', displayName: 'Chris Olave', shortName: 'OLAVE', uniformNumber: 12, teamCode: 'NO', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4426515', displayName: 'Rashid Shaheed', shortName: 'SHAHEED', uniformNumber: 22, teamCode: 'NO', position: 'WR', skinTone: '#523318' },
    { athleteId: '3116385', displayName: 'Cedrick Wilson Jr.', shortName: 'WILSON', uniformNumber: 11, teamCode: 'NO', position: 'WR', skinTone: '#523318' },
    { athleteId: '4035687', displayName: 'Juwan Johnson', shortName: 'JOHNSON', uniformNumber: 83, teamCode: 'NO', position: 'TE', skinTone: '#523318' },
    { athleteId: '15967', displayName: 'Taysom Hill', shortName: 'HILL', uniformNumber: 7, teamCode: 'NO', position: 'TE', skinTone: '#f8d9b6' },
  ],
  NYG: [
    { athleteId: '3917792', displayName: 'Daniel Jones', shortName: 'JONES', uniformNumber: 8, teamCode: 'NYG', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4040761', displayName: 'Devin Singletary', shortName: 'SINGLETARY', uniformNumber: 26, teamCode: 'NYG', position: 'RB', skinTone: '#523318' },
    { athleteId: '4426515', displayName: 'Tyrone Tracy Jr.', shortName: 'TRACY JR', uniformNumber: 29, teamCode: 'NYG', position: 'RB', skinTone: '#523318' },
    { athleteId: '4430878', displayName: 'Malik Nabers', shortName: 'NABERS', uniformNumber: 1, teamCode: 'NYG', position: 'WR', skinTone: '#523318' },
    { athleteId: '4426515', displayName: "Wan'Dale Robinson", shortName: 'ROBINSON', uniformNumber: 17, teamCode: 'NYG', position: 'WR', skinTone: '#523318' },
    { athleteId: '3915416', displayName: 'Darius Slayton', shortName: 'SLAYTON', uniformNumber: 86, teamCode: 'NYG', position: 'WR', skinTone: '#523318' },
    { athleteId: '4431452', displayName: 'Theo Johnson', shortName: 'JOHNSON', uniformNumber: 84, teamCode: 'NYG', position: 'TE', skinTone: '#c68642' },
  ],
  NYJ: [
    { athleteId: '8439', displayName: 'Aaron Rodgers', shortName: 'RODGERS', uniformNumber: 8, teamCode: 'NYJ', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4427366', displayName: 'Breece Hall', shortName: 'HALL', uniformNumber: 20, teamCode: 'NYJ', position: 'RB', skinTone: '#523318' },
    { athleteId: '4430807', displayName: 'Braelon Allen', shortName: 'ALLEN', uniformNumber: 0, teamCode: 'NYJ', position: 'RB', skinTone: '#523318' },
    { athleteId: '4430878', displayName: 'Garrett Wilson', shortName: 'WILSON', uniformNumber: 5, teamCode: 'NYJ', position: 'WR', skinTone: '#523318' },
    { athleteId: '16800', displayName: 'Davante Adams', shortName: 'ADAMS', uniformNumber: 17, teamCode: 'NYJ', position: 'WR', skinTone: '#523318' },
    { athleteId: '3116385', displayName: 'Allen Lazard', shortName: 'LAZARD', uniformNumber: 10, teamCode: 'NYJ', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '3045144', displayName: 'Tyler Conklin', shortName: 'CONKLIN', uniformNumber: 83, teamCode: 'NYJ', position: 'TE', skinTone: '#f8d9b6' },
  ],
  PHI: [
    { athleteId: '4040715', displayName: 'Jalen Hurts', shortName: 'HURTS', uniformNumber: 1, teamCode: 'PHI', position: 'QB', skinTone: '#8d5524' },
    { athleteId: '3929630', displayName: 'Saquon Barkley', shortName: 'BARKLEY', uniformNumber: 26, teamCode: 'PHI', position: 'RB', skinTone: '#523318' },
    { athleteId: '4361529', displayName: 'Kenneth Gainwell', shortName: 'GAINWELL', uniformNumber: 14, teamCode: 'PHI', position: 'RB', skinTone: '#523318' },
    { athleteId: '4047646', displayName: 'A.J. Brown', shortName: 'BROWN', uniformNumber: 11, teamCode: 'PHI', position: 'WR', skinTone: '#523318' },
    { athleteId: '4241464', displayName: 'DeVonta Smith', shortName: 'SMITH', uniformNumber: 6, teamCode: 'PHI', position: 'WR', skinTone: '#523318' },
    { athleteId: '4361370', displayName: 'Jahan Dotson', shortName: 'DOTSON', uniformNumber: 83, teamCode: 'PHI', position: 'WR', skinTone: '#523318' },
    { athleteId: '3121422', displayName: 'Dallas Goedert', shortName: 'GOEDERT', uniformNumber: 88, teamCode: 'PHI', position: 'TE', skinTone: '#f8d9b6' },
  ],
  PIT: [
    { athleteId: '14881', displayName: 'Russell Wilson', shortName: 'WILSON', uniformNumber: 3, teamCode: 'PIT', position: 'QB', skinTone: '#8d5524' },
    { athleteId: '4241457', displayName: 'Najee Harris', shortName: 'HARRIS', uniformNumber: 22, teamCode: 'PIT', position: 'RB', skinTone: '#523318' },
    { athleteId: '4361529', displayName: 'Jaylen Warren', shortName: 'WARREN', uniformNumber: 30, teamCode: 'PIT', position: 'RB', skinTone: '#523318' },
    { athleteId: '4426515', displayName: 'George Pickens', shortName: 'PICKENS', uniformNumber: 14, teamCode: 'PIT', position: 'WR', skinTone: '#523318' },
    { athleteId: '4035687', displayName: 'Van Jefferson', shortName: 'JEFFERSON', uniformNumber: 11, teamCode: 'PIT', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4426515', displayName: 'Calvin Austin III', shortName: 'AUSTIN', uniformNumber: 19, teamCode: 'PIT', position: 'WR', skinTone: '#523318' },
    { athleteId: '4361411', displayName: 'Pat Freiermuth', shortName: 'FREIERMUTH', uniformNumber: 88, teamCode: 'PIT', position: 'TE', skinTone: '#f8d9b6' },
  ],
  SEA: [
    { athleteId: '15864', displayName: 'Geno Smith', shortName: 'SMITH', uniformNumber: 7, teamCode: 'SEA', position: 'QB', skinTone: '#523318' },
    { athleteId: '4426515', displayName: 'Kenneth Walker III', shortName: 'WALKER', uniformNumber: 9, teamCode: 'SEA', position: 'RB', skinTone: '#523318' },
    { athleteId: '4426515', displayName: 'Zach Charbonnet', shortName: 'CHARBONNET', uniformNumber: 26, teamCode: 'SEA', position: 'RB', skinTone: '#c68642' },
    { athleteId: '4047650', displayName: 'DK Metcalf', shortName: 'METCALF', uniformNumber: 14, teamCode: 'SEA', position: 'WR', skinTone: '#523318' },
    { athleteId: '16790', displayName: 'Tyler Lockett', shortName: 'LOCKETT', uniformNumber: 16, teamCode: 'SEA', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4430878', displayName: 'Jaxon Smith-Njigba', shortName: 'SMITH-NJIGBA', uniformNumber: 11, teamCode: 'SEA', position: 'WR', skinTone: '#523318' },
    { athleteId: '4035687', displayName: 'Noah Fant', shortName: 'FANT', uniformNumber: 87, teamCode: 'SEA', position: 'TE', skinTone: '#523318' },
  ],
  SF: [
    { athleteId: '4361741', displayName: 'Brock Purdy', shortName: 'PURDY', uniformNumber: 13, teamCode: 'SF', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '3117251', displayName: 'Christian McCaffrey', shortName: 'MCCAFFREY', uniformNumber: 23, teamCode: 'SF', position: 'RB', skinTone: '#f8d9b6' },
    { athleteId: '4361529', displayName: 'Jordan Mason', shortName: 'MASON', uniformNumber: 24, teamCode: 'SF', position: 'RB', skinTone: '#523318' },
    { athleteId: '3916433', displayName: 'Deebo Samuel', shortName: 'SAMUEL', uniformNumber: 1, teamCode: 'SF', position: 'WR', skinTone: '#523318' },
    { athleteId: '3915416', displayName: 'Jauan Jennings', shortName: 'JENNINGS', uniformNumber: 15, teamCode: 'SF', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4430155', displayName: 'Ricky Pearsall', shortName: 'PEARSALL', uniformNumber: 14, teamCode: 'SF', position: 'WR', skinTone: '#f8d9b6' },
    { athleteId: '3040151', displayName: 'George Kittle', shortName: 'KITTLE', uniformNumber: 85, teamCode: 'SF', position: 'TE', skinTone: '#f8d9b6' },
  ],
  TB: [
    { athleteId: '3052587', displayName: 'Baker Mayfield', shortName: 'MAYFIELD', uniformNumber: 6, teamCode: 'TB', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4430807', displayName: 'Bucky Irving', shortName: 'IRVING', uniformNumber: 7, teamCode: 'TB', position: 'RB', skinTone: '#523318' },
    { athleteId: '4361529', displayName: 'Rachaad White', shortName: 'WHITE', uniformNumber: 1, teamCode: 'TB', position: 'RB', skinTone: '#523318' },
    { athleteId: '16737', displayName: 'Mike Evans', shortName: 'EVANS', uniformNumber: 13, teamCode: 'TB', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '3116165', displayName: 'Chris Godwin', shortName: 'GODWIN', uniformNumber: 14, teamCode: 'TB', position: 'WR', skinTone: '#523318' },
    { athleteId: '4430155', displayName: 'Jalen McMillan', shortName: 'MCMILLAN', uniformNumber: 15, teamCode: 'TB', position: 'WR', skinTone: '#8d5524' },
    { athleteId: '4361411', displayName: 'Cade Otton', shortName: 'OTTON', uniformNumber: 88, teamCode: 'TB', position: 'TE', skinTone: '#f8d9b6' },
  ],
  TEN: [
    { athleteId: '4426515', displayName: 'Will Levis', shortName: 'LEVIS', uniformNumber: 8, teamCode: 'TEN', position: 'QB', skinTone: '#f8d9b6' },
    { athleteId: '4035687', displayName: 'Tony Pollard', shortName: 'POLLARD', uniformNumber: 20, teamCode: 'TEN', position: 'RB', skinTone: '#523318' },
    { athleteId: '4426515', displayName: 'Tyjae Spears', shortName: 'SPEARS', uniformNumber: 2, teamCode: 'TEN', position: 'RB', skinTone: '#523318' },
    { athleteId: '3915416', displayName: 'Calvin Ridley', shortName: 'RIDLEY', uniformNumber: 0, teamCode: 'TEN', position: 'WR', skinTone: '#523318' },
    { athleteId: '4035689', displayName: 'Nick Westbrook-Ikhine', shortName: 'WESTBROOK', uniformNumber: 15, teamCode: 'TEN', position: 'WR', skinTone: '#523318' },
    { athleteId: '3045144', displayName: 'Tyler Boyd', shortName: 'BOYD', uniformNumber: 83, teamCode: 'TEN', position: 'WR', skinTone: '#523318' },
    { athleteId: '4426515', displayName: 'Chig Okonkwo', shortName: 'OKONKWO', uniformNumber: 85, teamCode: 'TEN', position: 'TE', skinTone: '#523318' },
  ],
  WSH: [
    { athleteId: '4426348', displayName: 'Jayden Daniels', shortName: 'DANIELS', uniformNumber: 5, teamCode: 'WSH', position: 'QB', skinTone: '#523318' },
    { athleteId: '4241457', displayName: 'Brian Robinson Jr.', shortName: 'ROBINSON JR', uniformNumber: 8, teamCode: 'WSH', position: 'RB', skinTone: '#523318' },
    { athleteId: '3068267', displayName: 'Austin Ekeler', shortName: 'EKELER', uniformNumber: 30, teamCode: 'WSH', position: 'RB', skinTone: '#8d5524' },
    { athleteId: '3121422', displayName: 'Terry McLaurin', shortName: 'MCLAURIN', uniformNumber: 17, teamCode: 'WSH', position: 'WR', skinTone: '#523318' },
    { athleteId: '3116385', displayName: 'Noah Brown', shortName: 'BROWN', uniformNumber: 85, teamCode: 'WSH', position: 'WR', skinTone: '#523318' },
    { athleteId: '4430155', displayName: 'Luke McCaffrey', shortName: 'MCCAFFREY', uniformNumber: 12, teamCode: 'WSH', position: 'WR', skinTone: '#f8d9b6' },
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
