import zlib, struct, os

def make_png(width, height, pixels):
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0
        for x in range(width):
            raw_data.extend(pixels[y][x])

    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw_data), level=9)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')

def hex_to_rgba(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

CLEAR = (0, 0, 0, 0)
BLACK = (17, 17, 17, 255)
WHITE = (255, 255, 255, 255)
GREY = (156, 163, 175, 255)
DARK_GREY = (75, 85, 99, 255)

def build_helmet_base(shell_color, facemask_color=GREY, earhole_pos=(11, 5)):
    grid = [[CLEAR for _ in range(16)] for _ in range(16)]
    
    # Standard 16x16 helmet silhouette
    for x in range(4, 11): grid[0][x] = BLACK
    grid[1][2] = BLACK; grid[1][3] = BLACK
    for x in range(4, 11): grid[1][x] = shell_color
    grid[1][11] = BLACK; grid[1][12] = BLACK
    grid[2][1] = BLACK; grid[2][2] = BLACK
    for x in range(3, 13): grid[2][x] = shell_color
    grid[2][13] = BLACK
    for y in range(3, 9):
        grid[y][1] = BLACK
        for x in range(2, 14): grid[y][x] = shell_color
        grid[y][14] = BLACK
    grid[9][1] = BLACK
    for x in range(2, 12): grid[9][x] = shell_color
    grid[9][12] = facemask_color; grid[9][13] = facemask_color; grid[9][14] = BLACK
    grid[10][1] = BLACK
    for x in range(2, 10): grid[10][x] = shell_color
    grid[10][10] = facemask_color; grid[10][11] = facemask_color; grid[10][12] = facemask_color; grid[10][13] = facemask_color; grid[10][14] = BLACK
    grid[11][1] = BLACK
    for x in range(2, 9): grid[11][x] = shell_color
    grid[11][9] = facemask_color; grid[11][12] = facemask_color; grid[11][13] = facemask_color; grid[11][14] = BLACK
    grid[12][1] = BLACK; grid[12][2] = BLACK
    for x in range(3, 9): grid[12][x] = shell_color
    for x in range(9, 15): grid[12][x] = facemask_color
    grid[12][15] = BLACK
    grid[13][2] = BLACK; grid[13][3] = BLACK
    for x in range(4, 9): grid[13][x] = shell_color
    grid[13][9] = facemask_color; grid[13][11] = facemask_color; grid[13][13] = facemask_color; grid[13][14] = facemask_color; grid[13][15] = BLACK
    for x in range(3, 10): grid[14][x] = BLACK
    for x in range(10, 15): grid[14][x] = facemask_color
    grid[14][15] = BLACK
    for x in range(10, 16): grid[15][x] = BLACK

    ey, ex = earhole_pos
    grid[ey][ex] = BLACK
    grid[ey][ex+1] = BLACK
    grid[ey+1][ex] = BLACK
    grid[ey+1][ex+1] = BLACK

    return grid

def generate_all():
    os.makedirs('public/helmets', exist_ok=True)

    # 1. ARIZONA (White shell, Cardinal head, Grey facemask)
    ari = build_helmet_base(WHITE, GREY)
    RED = hex_to_rgba('#C41230')
    GOLD = hex_to_rgba('#FFB612')
    ari[3][3] = RED; ari[3][4] = RED
    ari[4][3] = RED; ari[4][4] = RED; ari[4][5] = RED; ari[4][6] = RED; ari[4][7] = RED; ari[4][8] = RED
    ari[5][5] = BLACK; ari[5][6] = BLACK; ari[5][7] = RED; ari[5][8] = RED
    ari[6][5] = RED; ari[6][6] = BLACK; ari[6][7] = BLACK; ari[6][8] = GOLD; ari[6][9] = GOLD
    ari[7][5] = RED; ari[7][6] = RED; ari[7][7] = BLACK; ari[7][8] = BLACK
    ari[8][6] = RED; ari[8][7] = RED

    # 2. ATLANTA (Black shell, Falcon F logo, Dark Grey facemask)
    atl = build_helmet_base(BLACK, DARK_GREY)
    RED_ATL = hex_to_rgba('#EA0029')
    atl[3][5] = WHITE; atl[3][6] = WHITE; atl[3][7] = WHITE; atl[3][8] = WHITE; atl[3][9] = WHITE
    atl[4][4] = WHITE; atl[4][5] = RED_ATL; atl[4][6] = RED_ATL; atl[4][7] = RED_ATL; atl[4][8] = WHITE
    atl[5][4] = WHITE; atl[5][5] = RED_ATL; atl[5][6] = RED_ATL; atl[5][7] = BLACK; atl[5][8] = WHITE
    atl[6][5] = WHITE; atl[6][6] = WHITE; atl[6][7] = BLACK; atl[6][8] = WHITE
    atl[7][6] = WHITE; atl[7][7] = RED_ATL; atl[7][8] = WHITE
    atl[8][7] = WHITE; atl[8][8] = WHITE

    # 3. BALTIMORE (Black shell, Raven profile, gold beak)
    bal = build_helmet_base(hex_to_rgba('#120D18'), DARK_GREY)
    PURPLE_BAL = hex_to_rgba('#4B207D')
    GOLD_BAL = hex_to_rgba('#D9A826')
    RED_BAL = hex_to_rgba('#C41230')
    bal[2][11] = PURPLE_BAL; bal[3][12] = PURPLE_BAL; bal[4][12] = PURPLE_BAL
    bal[4][3] = PURPLE_BAL; bal[4][4] = PURPLE_BAL; bal[4][5] = PURPLE_BAL; bal[4][6] = PURPLE_BAL; bal[4][7] = PURPLE_BAL; bal[4][8] = PURPLE_BAL
    bal[5][3] = PURPLE_BAL; bal[5][4] = PURPLE_BAL; bal[5][5] = GOLD_BAL; bal[5][6] = GOLD_BAL; bal[5][7] = RED_BAL; bal[5][8] = PURPLE_BAL
    bal[6][3] = PURPLE_BAL; bal[6][4] = PURPLE_BAL; bal[6][5] = GOLD_BAL; bal[6][6] = GOLD_BAL; bal[6][7] = WHITE; bal[6][8] = WHITE; bal[6][9] = WHITE
    bal[7][4] = PURPLE_BAL; bal[7][5] = PURPLE_BAL; bal[7][6] = PURPLE_BAL

    # 4. BUFFALO (Red shell, royal blue buffalo with white horn, white facemask)
    buf = build_helmet_base(hex_to_rgba('#C60C30'), WHITE)
    BLUE_BUF = hex_to_rgba('#00338D')
    buf[4][6] = BLUE_BUF; buf[4][7] = BLUE_BUF; buf[4][8] = BLUE_BUF; buf[4][9] = BLUE_BUF; buf[4][10] = BLUE_BUF
    buf[5][5] = BLUE_BUF; buf[5][6] = BLUE_BUF; buf[5][7] = WHITE; buf[5][8] = BLUE_BUF; buf[5][9] = BLUE_BUF; buf[5][10] = BLUE_BUF
    buf[6][4] = BLUE_BUF; buf[6][5] = BLUE_BUF; buf[6][6] = BLUE_BUF; buf[6][7] = BLUE_BUF; buf[6][8] = BLUE_BUF; buf[6][9] = BLUE_BUF; buf[6][10] = BLUE_BUF
    buf[7][4] = BLUE_BUF; buf[7][5] = BLUE_BUF; buf[7][7] = BLUE_BUF; buf[7][8] = BLUE_BUF
    buf[8][4] = BLUE_BUF; buf[8][7] = BLUE_BUF

    # 5. CAROLINA (Silver shell, black panther with electric blue outline, dark facemask)
    car = build_helmet_base(hex_to_rgba('#A5ACAF'), DARK_GREY)
    BLUE_CAR = hex_to_rgba('#0085CA')
    car[4][5] = BLACK; car[4][6] = BLACK; car[4][7] = BLACK; car[4][8] = BLACK; car[4][9] = BLACK
    car[5][3] = BLUE_CAR; car[5][4] = BLACK; car[5][5] = BLACK; car[5][6] = BLACK; car[5][7] = WHITE; car[5][8] = BLACK; car[5][9] = BLACK
    car[6][3] = BLUE_CAR; car[6][4] = BLACK; car[6][5] = BLACK; car[6][6] = BLACK; car[6][7] = BLACK; car[6][8] = BLACK
    car[7][4] = BLUE_CAR; car[7][5] = BLUE_CAR; car[7][6] = BLACK; car[7][7] = BLACK; car[7][8] = BLUE_CAR
    car[8][5] = BLUE_CAR; car[8][6] = BLUE_CAR

    # 6. CHICAGO (Navy shell, classic wishbone orange C, grey facemask)
    chi = build_helmet_base(hex_to_rgba('#0B162A'), GREY)
    ORANGE_CHI = hex_to_rgba('#C83803')
    chi[4][5] = ORANGE_CHI; chi[4][6] = ORANGE_CHI; chi[4][7] = ORANGE_CHI; chi[4][8] = ORANGE_CHI; chi[4][9] = ORANGE_CHI
    chi[5][4] = ORANGE_CHI; chi[5][5] = ORANGE_CHI; chi[5][9] = ORANGE_CHI; chi[5][10] = ORANGE_CHI
    chi[6][3] = ORANGE_CHI; chi[6][4] = ORANGE_CHI
    chi[7][4] = ORANGE_CHI; chi[7][5] = ORANGE_CHI; chi[7][9] = ORANGE_CHI; chi[7][10] = ORANGE_CHI
    chi[8][5] = ORANGE_CHI; chi[8][6] = ORANGE_CHI; chi[8][7] = ORANGE_CHI; chi[8][8] = ORANGE_CHI; chi[8][9] = ORANGE_CHI

    # 7. CINCINNATI (Vibrant Orange shell with black tiger stripes)
    cin = build_helmet_base(hex_to_rgba('#FB4F14'), BLACK)
    cin[2][6] = BLACK; cin[2][7] = BLACK; cin[2][10] = BLACK
    cin[3][4] = BLACK; cin[3][5] = BLACK; cin[3][8] = BLACK; cin[3][9] = BLACK; cin[3][12] = BLACK
    cin[4][2] = BLACK; cin[4][3] = BLACK; cin[4][7] = BLACK; cin[4][8] = BLACK; cin[4][11] = BLACK
    cin[5][2] = BLACK; cin[5][6] = BLACK; cin[5][7] = BLACK; cin[5][10] = BLACK; cin[5][11] = BLACK; cin[5][12] = BLACK
    cin[6][2] = BLACK; cin[6][5] = BLACK; cin[6][6] = BLACK; cin[6][9] = BLACK; cin[6][10] = BLACK
    cin[7][2] = BLACK; cin[7][3] = BLACK; cin[7][4] = BLACK; cin[7][8] = BLACK; cin[7][9] = BLACK; cin[7][10] = BLACK
    cin[8][3] = BLACK; cin[8][4] = BLACK; cin[8][7] = BLACK; cin[8][8] = BLACK

    # 8. CLEVELAND (Solid Orange helmet, brown/white/brown center crown stripe, white facemask)
    cle = build_helmet_base(hex_to_rgba('#EB5E00'), WHITE)
    BROWN_CLE = hex_to_rgba('#311D00')
    cle[1][5] = BROWN_CLE; cle[1][6] = WHITE; cle[1][7] = BROWN_CLE
    cle[2][4] = BROWN_CLE; cle[2][5] = WHITE; cle[2][6] = BROWN_CLE
    cle[3][3] = BROWN_CLE; cle[3][4] = WHITE; cle[3][5] = BROWN_CLE
    cle[4][2] = BROWN_CLE; cle[4][3] = WHITE; cle[4][4] = BROWN_CLE
    cle[5][2] = BROWN_CLE; cle[5][3] = WHITE; cle[5][4] = BROWN_CLE
    cle[6][2] = BROWN_CLE; cle[6][3] = WHITE; cle[6][4] = BROWN_CLE
    cle[7][2] = BROWN_CLE; cle[7][3] = WHITE; cle[7][4] = BROWN_CLE
    cle[8][2] = BROWN_CLE; cle[8][3] = WHITE; cle[8][4] = BROWN_CLE

    # 9. DALLAS (Silver-blue shell, navy star, white facemask)
    dal = build_helmet_base(hex_to_rgba('#B0B7BC'), WHITE)
    NAVY_DAL = hex_to_rgba('#002244')
    dal[3][6] = NAVY_DAL
    dal[4][4] = NAVY_DAL; dal[4][5] = NAVY_DAL; dal[4][6] = NAVY_DAL; dal[4][7] = NAVY_DAL; dal[4][8] = NAVY_DAL
    dal[5][5] = NAVY_DAL; dal[5][6] = NAVY_DAL; dal[5][7] = NAVY_DAL
    dal[6][4] = NAVY_DAL; dal[6][5] = NAVY_DAL; dal[6][6] = NAVY_DAL; dal[6][7] = NAVY_DAL; dal[6][8] = NAVY_DAL
    dal[7][4] = NAVY_DAL; dal[7][5] = NAVY_DAL; dal[7][7] = NAVY_DAL; dal[7][8] = NAVY_DAL
    dal[8][4] = NAVY_DAL; dal[8][8] = NAVY_DAL

    # 10. DENVER (Navy shell, white horse head profile with orange mane, navy facemask)
    den = build_helmet_base(hex_to_rgba('#002244'), hex_to_rgba('#002244'))
    ORANGE_DEN = hex_to_rgba('#FB4F14')
    den[4][5] = ORANGE_DEN; den[4][6] = ORANGE_DEN; den[4][7] = WHITE; den[4][8] = WHITE; den[4][9] = WHITE; den[4][10] = WHITE
    den[5][4] = ORANGE_DEN; den[5][5] = ORANGE_DEN; den[5][6] = WHITE; den[5][7] = hex_to_rgba('#002244'); den[5][8] = WHITE; den[5][9] = WHITE
    den[6][3] = ORANGE_DEN; den[6][4] = ORANGE_DEN; den[6][5] = WHITE; den[6][6] = WHITE; den[6][7] = WHITE; den[6][8] = WHITE
    den[7][2] = ORANGE_DEN; den[7][3] = ORANGE_DEN; den[7][4] = WHITE; den[7][5] = WHITE; den[7][6] = WHITE

    # 11. DETROIT (Batch 2 - Silver shell, Blue Lion, Honolulu Blue Facemask!)
    BLUE_DET = hex_to_rgba('#0076B6')
    det = build_helmet_base(hex_to_rgba('#A5ACAF'), BLUE_DET)
    det[4][7] = BLUE_DET; det[4][8] = BLUE_DET; det[4][9] = BLUE_DET
    det[5][4] = BLUE_DET; det[5][6] = BLUE_DET; det[5][7] = BLUE_DET; det[5][8] = BLUE_DET; det[5][9] = BLUE_DET; det[5][10] = BLUE_DET
    det[6][5] = BLUE_DET; det[6][6] = BLUE_DET; det[6][7] = BLUE_DET; det[6][8] = BLUE_DET; det[6][9] = BLUE_DET; det[6][10] = BLUE_DET
    det[7][4] = BLUE_DET; det[7][5] = BLUE_DET; det[7][7] = BLUE_DET; det[7][8] = BLUE_DET; det[7][9] = BLUE_DET
    det[8][4] = BLUE_DET; det[8][7] = BLUE_DET

    # 12. GREEN BAY (Batch 2 - Gold shell, Green G oval with white center, Green facemask!)
    DARK_GREEN = hex_to_rgba('#203731')
    gb = build_helmet_base(hex_to_rgba('#FFB612'), DARK_GREEN)
    gb[4][4] = DARK_GREEN; gb[4][5] = DARK_GREEN; gb[4][6] = DARK_GREEN; gb[4][7] = DARK_GREEN; gb[4][8] = DARK_GREEN; gb[4][9] = DARK_GREEN
    gb[5][3] = DARK_GREEN; gb[5][4] = DARK_GREEN; gb[5][5] = WHITE; gb[5][6] = WHITE; gb[5][7] = WHITE; gb[5][8] = DARK_GREEN; gb[5][9] = DARK_GREEN; gb[5][10] = DARK_GREEN
    gb[6][3] = DARK_GREEN; gb[6][4] = DARK_GREEN; gb[6][5] = WHITE; gb[6][6] = WHITE; gb[6][7] = WHITE; gb[6][8] = DARK_GREEN; gb[6][9] = DARK_GREEN; gb[6][10] = DARK_GREEN
    gb[7][3] = DARK_GREEN; gb[7][4] = DARK_GREEN; gb[7][5] = DARK_GREEN; gb[7][6] = DARK_GREEN; gb[7][7] = DARK_GREEN; gb[7][8] = DARK_GREEN; gb[7][9] = DARK_GREEN; gb[7][10] = DARK_GREEN
    gb[8][4] = DARK_GREEN; gb[8][5] = DARK_GREEN; gb[8][6] = DARK_GREEN; gb[8][7] = DARK_GREEN; gb[8][8] = DARK_GREEN; gb[8][9] = DARK_GREEN

    # 13. HOUSTON (Batch 2 - Deep Navy/Black shell, Bull head with red & white horns, grey facemask)
    hou = build_helmet_base(hex_to_rgba('#0A1424'), DARK_GREY)
    RED_HOU = hex_to_rgba('#C9243F')
    hou[3][6] = WHITE; hou[3][8] = RED_HOU
    hou[4][4] = WHITE; hou[4][5] = WHITE; hou[4][8] = RED_HOU
    hou[5][3] = WHITE; hou[5][5] = WHITE; hou[5][8] = RED_HOU; hou[5][9] = RED_HOU; hou[5][10] = RED_HOU
    hou[6][6] = WHITE; hou[6][8] = RED_HOU; hou[6][9] = RED_HOU; hou[6][10] = RED_HOU
    hou[7][6] = WHITE; hou[7][7] = RED_HOU; hou[7][8] = RED_HOU

    # 14. INDIANAPOLIS (Batch 2 - White shell, Blue Horseshoe, Grey facemask)
    BLUE_IND = hex_to_rgba('#002C5F')
    ind = build_helmet_base(WHITE, GREY)
    ind[4][3] = BLUE_IND; ind[4][4] = BLUE_IND; ind[4][8] = BLUE_IND; ind[4][9] = BLUE_IND
    ind[5][3] = BLUE_IND; ind[5][4] = BLUE_IND; ind[5][6] = BLUE_IND; ind[5][7] = BLUE_IND; ind[5][8] = BLUE_IND; ind[5][9] = BLUE_IND
    ind[6][3] = BLUE_IND; ind[6][4] = BLUE_IND; ind[6][8] = BLUE_IND; ind[6][9] = BLUE_IND
    ind[7][4] = BLUE_IND; ind[7][5] = BLUE_IND; ind[7][7] = BLUE_IND; ind[7][8] = BLUE_IND
    ind[8][5] = BLUE_IND; ind[8][6] = BLUE_IND; ind[8][7] = BLUE_IND

    # 15. JACKSONVILLE (Batch 2 - Black shell with gold back gradient, gold jaguar head with teal tongue)
    jax = build_helmet_base(BLACK, DARK_GREY)
    GOLD_JAX = hex_to_rgba('#D7A22A')
    TEAL_JAX = hex_to_rgba('#006778')
    for y in range(5, 14):
        jax[y][2] = hex_to_rgba('#946E16')
        jax[y][3] = GOLD_JAX
    jax[3][5] = GOLD_JAX; jax[3][6] = GOLD_JAX; jax[3][7] = GOLD_JAX; jax[3][8] = GOLD_JAX
    jax[4][4] = WHITE; jax[4][5] = GOLD_JAX; jax[4][6] = TEAL_JAX; jax[4][7] = GOLD_JAX; jax[4][8] = GOLD_JAX; jax[4][9] = GOLD_JAX
    jax[5][4] = GOLD_JAX; jax[5][5] = GOLD_JAX; jax[5][6] = GOLD_JAX; jax[5][7] = WHITE; jax[5][8] = GOLD_JAX; jax[5][9] = GOLD_JAX
    jax[6][5] = GOLD_JAX; jax[6][6] = TEAL_JAX; jax[6][7] = TEAL_JAX; jax[6][8] = GOLD_JAX
    jax[7][6] = WHITE; jax[7][7] = WHITE; jax[7][8] = TEAL_JAX; jax[7][9] = TEAL_JAX

    # 16. KANSAS CITY (Batch 2 - Red shell, White Arrowhead, White facemask)
    kc = build_helmet_base(hex_to_rgba('#E31837'), WHITE)
    kc[4][4] = WHITE; kc[4][5] = WHITE; kc[4][6] = WHITE
    kc[5][3] = WHITE; kc[5][5] = WHITE; kc[5][6] = WHITE; kc[5][7] = WHITE; kc[5][8] = WHITE
    kc[6][3] = WHITE; kc[6][4] = WHITE; kc[6][7] = WHITE; kc[6][8] = WHITE; kc[6][9] = WHITE
    kc[7][3] = WHITE; kc[7][4] = WHITE; kc[7][5] = WHITE; kc[7][6] = WHITE; kc[7][7] = WHITE
    kc[8][4] = WHITE; kc[8][5] = WHITE; kc[8][6] = WHITE; kc[8][7] = WHITE

    # 17. LOS ANGELES RAMS (Batch 2 - Royal Blue shell, Sol Yellow Horn curving around earhole)
    SOL_LAR = hex_to_rgba('#FFD100')
    lar = build_helmet_base(hex_to_rgba('#003594'), hex_to_rgba('#4A607A'))
    lar[3][4] = SOL_LAR; lar[3][5] = SOL_LAR; lar[3][6] = SOL_LAR; lar[3][7] = SOL_LAR; lar[3][8] = SOL_LAR
    lar[4][3] = SOL_LAR; lar[4][4] = SOL_LAR; lar[4][5] = SOL_LAR; lar[4][8] = SOL_LAR; lar[4][9] = SOL_LAR; lar[4][10] = SOL_LAR
    lar[5][2] = SOL_LAR; lar[5][3] = SOL_LAR; lar[5][9] = SOL_LAR; lar[5][10] = SOL_LAR; lar[5][11] = SOL_LAR
    lar[6][2] = SOL_LAR; lar[6][3] = SOL_LAR; lar[6][10] = SOL_LAR; lar[6][11] = SOL_LAR
    lar[7][2] = SOL_LAR; lar[7][3] = SOL_LAR; lar[7][4] = SOL_LAR; lar[7][5] = SOL_LAR; lar[7][6] = SOL_LAR; lar[7][7] = SOL_LAR; lar[7][8] = SOL_LAR; lar[7][9] = SOL_LAR; lar[7][10] = SOL_LAR
    lar[8][3] = SOL_LAR; lar[8][4] = SOL_LAR; lar[8][5] = SOL_LAR

    # 18. MIAMI (Batch 2 - White shell, Aqua dolphin jumping through Orange sunburst ring, Aqua facemask)
    AQUA = hex_to_rgba('#008E97')
    ORANGE_MIA = hex_to_rgba('#FC4C02')
    mia = build_helmet_base(WHITE, AQUA)
    mia[4][5] = ORANGE_MIA; mia[4][6] = ORANGE_MIA; mia[4][7] = ORANGE_MIA; mia[4][8] = ORANGE_MIA
    mia[5][4] = ORANGE_MIA; mia[5][6] = AQUA; mia[5][7] = AQUA; mia[5][9] = ORANGE_MIA
    mia[6][3] = AQUA; mia[6][4] = ORANGE_MIA; mia[6][6] = AQUA; mia[6][7] = AQUA; mia[6][9] = ORANGE_MIA; mia[6][10] = AQUA
    mia[7][3] = AQUA; mia[7][4] = AQUA; mia[7][5] = AQUA; mia[7][6] = AQUA; mia[7][7] = AQUA; mia[7][8] = ORANGE_MIA; mia[7][9] = ORANGE_MIA
    mia[8][5] = AQUA; mia[8][6] = ORANGE_MIA; mia[8][7] = ORANGE_MIA

    # 19. MINNESOTA (Batch 2 - Deep Purple shell, White & Gold Viking horn, Purple facemask)
    PURPLE_MIN = hex_to_rgba('#4F2683')
    min_v = build_helmet_base(PURPLE_MIN, hex_to_rgba('#7C3AED'))
    GOLD_MIN = hex_to_rgba('#FFC20E')
    min_v[3][4] = WHITE
    min_v[4][5] = WHITE; min_v[4][6] = WHITE; min_v[4][7] = WHITE; min_v[4][8] = WHITE; min_v[4][9] = WHITE; min_v[4][10] = WHITE
    min_v[5][6] = WHITE; min_v[5][7] = WHITE; min_v[5][8] = GOLD_MIN; min_v[5][9] = GOLD_MIN; min_v[5][10] = GOLD_MIN; min_v[5][11] = GOLD_MIN
    min_v[6][8] = GOLD_MIN; min_v[6][9] = GOLD_MIN; min_v[6][10] = GOLD_MIN; min_v[6][11] = GOLD_MIN
    min_v[7][9] = GOLD_MIN; min_v[7][10] = GOLD_MIN

    # 20. NEW ENGLAND (Batch 2 - Silver shell, Flying Elvis navy & red, Red facemask)
    ne = build_helmet_base(hex_to_rgba('#B0B7BC'), hex_to_rgba('#C60C30'))
    NAVY_NE = hex_to_rgba('#002244')
    RED_NE = hex_to_rgba('#C60C30')
    ne[4][7] = NAVY_NE; ne[4][8] = NAVY_NE; ne[4][9] = NAVY_NE
    ne[5][3] = RED_NE; ne[5][4] = RED_NE; ne[5][5] = RED_NE; ne[5][6] = NAVY_NE; ne[5][7] = NAVY_NE; ne[5][8] = WHITE; ne[5][9] = NAVY_NE; ne[5][10] = NAVY_NE
    ne[6][3] = WHITE; ne[6][4] = WHITE; ne[6][5] = NAVY_NE; ne[6][6] = NAVY_NE; ne[6][7] = NAVY_NE; ne[6][8] = NAVY_NE; ne[6][9] = NAVY_NE; ne[6][10] = NAVY_NE
    ne[7][4] = RED_NE; ne[7][5] = RED_NE; ne[7][6] = NAVY_NE; ne[7][7] = NAVY_NE; ne[7][8] = NAVY_NE

    # 21. NEW ORLEANS (Batch 2 - Old Gold shell, Black Fleur-de-lis, Black facemask)
    no_s = build_helmet_base(hex_to_rgba('#C2A970'), BLACK)
    no_s[3][6] = BLACK
    no_s[4][6] = BLACK
    no_s[5][3] = BLACK; no_s[5][5] = BLACK; no_s[5][6] = BLACK; no_s[5][7] = BLACK; no_s[5][9] = BLACK
    no_s[6][3] = BLACK; no_s[6][4] = BLACK; no_s[6][5] = BLACK; no_s[6][6] = BLACK; no_s[6][7] = BLACK; no_s[6][8] = BLACK; no_s[6][9] = BLACK
    no_s[7][5] = BLACK; no_s[7][6] = BLACK; no_s[7][7] = BLACK
    no_s[8][6] = BLACK

    # 22. NEW YORK JETS (NewYorkA - Batch 2 - White shell, Green oval JETS logo, Green facemask)
    GREEN_JETS = hex_to_rgba('#125740')
    nyj = build_helmet_base(WHITE, GREEN_JETS)
    nyj[4][5] = GREEN_JETS; nyj[4][6] = GREEN_JETS; nyj[4][7] = GREEN_JETS; nyj[4][8] = GREEN_JETS; nyj[4][9] = GREEN_JETS
    nyj[5][4] = GREEN_JETS; nyj[5][5] = WHITE; nyj[5][6] = WHITE; nyj[5][7] = WHITE; nyj[5][8] = WHITE; nyj[5][9] = WHITE; nyj[5][10] = GREEN_JETS
    nyj[6][4] = GREEN_JETS; nyj[6][5] = WHITE; nyj[6][6] = GREEN_JETS; nyj[6][7] = WHITE; nyj[6][8] = GREEN_JETS; nyj[6][9] = WHITE; nyj[6][10] = GREEN_JETS
    nyj[7][4] = GREEN_JETS; nyj[7][5] = GREEN_JETS; nyj[7][6] = GREEN_JETS; nyj[7][7] = GREEN_JETS; nyj[7][8] = GREEN_JETS; nyj[7][9] = GREEN_JETS; nyj[7][10] = GREEN_JETS
    nyj[8][5] = GREEN_JETS; nyj[8][6] = GREEN_JETS; nyj[8][7] = GREEN_JETS; nyj[8][8] = GREEN_JETS; nyj[8][9] = GREEN_JETS

    # 23. NEW YORK GIANTS (NewYorkN - Batch 2 - Royal Blue shell, Red stripe, White ny logo, White facemask)
    nyg = build_helmet_base(hex_to_rgba('#0B2265'), WHITE)
    for y in range(1, 9):
        nyg[y][3] = hex_to_rgba('#C60C30')
    nyg[4][5] = WHITE; nyg[4][7] = WHITE; nyg[4][8] = WHITE
    nyg[5][5] = WHITE; nyg[5][6] = WHITE; nyg[5][7] = WHITE; nyg[5][8] = WHITE; nyg[5][9] = WHITE
    nyg[6][5] = WHITE; nyg[6][7] = WHITE; nyg[6][9] = WHITE
    nyg[7][5] = WHITE; nyg[7][7] = WHITE; nyg[7][9] = WHITE; nyg[7][10] = WHITE

    # 24. OAKLAND / LAS VEGAS (Batch 2 - Silver shell, Black shield with silver Raider face, Dark grey facemask)
    lv = build_helmet_base(hex_to_rgba('#B0B7BC'), DARK_GREY)
    lv[3][6] = BLACK
    lv[4][4] = BLACK; lv[4][5] = BLACK; lv[4][6] = BLACK; lv[4][7] = BLACK; lv[4][8] = BLACK
    lv[5][4] = BLACK; lv[5][5] = BLACK; lv[5][6] = WHITE; lv[5][7] = BLACK; lv[5][8] = BLACK
    lv[6][4] = BLACK; lv[6][5] = BLACK; lv[6][6] = GREY; lv[6][7] = BLACK; lv[6][8] = BLACK
    lv[7][5] = BLACK; lv[7][6] = BLACK; lv[7][7] = BLACK
    lv[8][6] = BLACK

    # 25. PHILADELPHIA (Batch 2 - Midnight Green shell, Silver & White Eagle wings, Silver facemask)
    phi = build_helmet_base(hex_to_rgba('#004C54'), GREY)
    phi[3][4] = WHITE; phi[3][5] = WHITE; phi[3][6] = WHITE; phi[3][7] = WHITE
    phi[4][3] = WHITE; phi[4][4] = WHITE; phi[4][5] = GREY; phi[4][6] = GREY; phi[4][7] = GREY; phi[4][8] = GREY; phi[4][9] = GREY
    phi[5][4] = GREY; phi[5][5] = GREY; phi[5][6] = GREY; phi[5][7] = WHITE; phi[5][8] = GREY; phi[5][9] = GREY; phi[5][10] = GREY
    phi[6][5] = GREY; phi[6][6] = GREY; phi[6][7] = GREY; phi[6][8] = GREY

    # 26. PITTSBURGH (Batch 2 - Black shell, Gold crown stripe, White circle with 3 diamonds, Dark facemask)
    pit = build_helmet_base(BLACK, DARK_GREY)
    GOLD_PIT = hex_to_rgba('#FFB612')
    RED_PIT = hex_to_rgba('#C60C30')
    BLUE_PIT = hex_to_rgba('#00338D')
    for y in range(1, 9): pit[y][2] = GOLD_PIT
    pit[4][6] = WHITE; pit[4][7] = WHITE; pit[4][8] = WHITE
    pit[5][5] = WHITE; pit[5][6] = GOLD_PIT; pit[5][7] = WHITE; pit[5][8] = RED_PIT; pit[5][9] = WHITE
    pit[6][5] = WHITE; pit[6][6] = BLUE_PIT; pit[6][7] = WHITE; pit[6][8] = WHITE; pit[6][9] = WHITE
    pit[7][6] = WHITE; pit[7][7] = WHITE; pit[7][8] = WHITE

    # 27. SAN DIEGO / LA CHARGERS (Batch 2 - White shell, Gold & Navy lightning bolt, Navy facemask)
    lac = build_helmet_base(WHITE, hex_to_rgba('#002244'))
    BOLT_GOLD = hex_to_rgba('#FFC20E')
    BOLT_NAVY = hex_to_rgba('#002244')
    lac[3][5] = BOLT_NAVY; lac[3][6] = BOLT_NAVY; lac[3][7] = BOLT_NAVY; lac[3][8] = BOLT_NAVY
    lac[4][4] = BOLT_NAVY; lac[4][5] = BOLT_GOLD; lac[4][6] = BOLT_GOLD; lac[4][7] = BOLT_GOLD; lac[4][8] = BOLT_GOLD; lac[4][9] = BOLT_NAVY
    lac[5][3] = BOLT_NAVY; lac[5][4] = BOLT_GOLD; lac[5][5] = BOLT_NAVY; lac[5][6] = BOLT_NAVY; lac[5][7] = BOLT_GOLD; lac[5][8] = BOLT_NAVY
    lac[6][3] = BOLT_NAVY; lac[6][4] = BOLT_GOLD; lac[6][5] = BOLT_NAVY
    lac[7][3] = BOLT_NAVY

    # 28. SAN FRANCISCO (Batch 2 - Gold shell, Red center stripe, Red oval with white SF, Grey facemask)
    sf = build_helmet_base(hex_to_rgba('#C5A869'), GREY)
    RED_SF = hex_to_rgba('#AA0000')
    for y in range(1, 9): sf[y][2] = RED_SF
    sf[4][4] = RED_SF; sf[4][5] = RED_SF; sf[4][6] = RED_SF; sf[4][7] = RED_SF; sf[4][8] = RED_SF; sf[4][9] = RED_SF
    sf[5][3] = RED_SF; sf[5][4] = RED_SF; sf[5][5] = WHITE; sf[5][6] = WHITE; sf[5][7] = WHITE; sf[5][8] = RED_SF; sf[5][9] = RED_SF; sf[5][10] = RED_SF
    sf[6][3] = RED_SF; sf[6][4] = RED_SF; sf[6][5] = WHITE; sf[6][6] = RED_SF; sf[6][7] = WHITE; sf[6][8] = RED_SF; sf[6][9] = RED_SF; sf[6][10] = RED_SF
    sf[7][3] = RED_SF; sf[7][4] = RED_SF; sf[7][5] = RED_SF; sf[7][6] = RED_SF; sf[7][7] = RED_SF; sf[7][8] = RED_SF; sf[7][9] = RED_SF; sf[7][10] = RED_SF
    sf[8][4] = RED_SF; sf[8][5] = RED_SF; sf[8][6] = RED_SF; sf[8][7] = RED_SF; sf[8][8] = RED_SF; sf[8][9] = RED_SF

    # 29. SEATTLE (Batch 2 - College Navy shell, Action Green & Silver Hawk head, Navy facemask)
    sea = build_helmet_base(hex_to_rgba('#002244'), hex_to_rgba('#002244'))
    GREEN_SEA = hex_to_rgba('#69BE28')
    sea[4][3] = WHITE; sea[4][4] = WHITE; sea[4][5] = WHITE; sea[4][6] = WHITE; sea[4][7] = WHITE; sea[4][8] = WHITE
    sea[5][3] = WHITE; sea[5][4] = WHITE; sea[5][5] = WHITE; sea[5][6] = GREEN_SEA; sea[5][7] = GREEN_SEA; sea[5][8] = WHITE; sea[5][9] = WHITE
    sea[6][3] = GREY; sea[6][4] = GREY; sea[6][5] = GREY; sea[6][6] = GREY; sea[6][7] = WHITE; sea[6][8] = WHITE; sea[6][9] = WHITE
    sea[7][3] = WHITE; sea[7][4] = WHITE; sea[7][5] = WHITE; sea[7][6] = WHITE; sea[7][7] = WHITE

    # 30. TAMPA BAY (Batch 2 - Pewter shell, Red pirate flag with white skull emblem, White facemask)
    tb = build_helmet_base(hex_to_rgba('#5A4B41'), WHITE)
    RED_TB = hex_to_rgba('#D50A0A')
    tb[4][4] = RED_TB; tb[4][5] = RED_TB; tb[4][6] = RED_TB; tb[4][7] = RED_TB; tb[4][8] = RED_TB; tb[4][9] = RED_TB
    tb[5][4] = RED_TB; tb[5][5] = WHITE; tb[5][6] = RED_TB; tb[5][7] = WHITE; tb[5][8] = RED_TB; tb[5][9] = RED_TB
    tb[6][4] = RED_TB; tb[6][5] = WHITE; tb[6][6] = WHITE; tb[6][7] = WHITE; tb[6][8] = RED_TB; tb[6][9] = RED_TB
    tb[7][4] = RED_TB; tb[7][5] = WHITE; tb[7][6] = RED_TB; tb[7][7] = WHITE; tb[7][8] = RED_TB; tb[7][9] = RED_TB
    tb[8][4] = RED_TB; tb[8][5] = RED_TB; tb[8][6] = RED_TB; tb[8][7] = RED_TB; tb[8][8] = RED_TB; tb[8][9] = RED_TB

    # 31. TENNESSEE (Batch 2 - White shell, Navy circle with flame sword T, Navy facemask)
    ten = build_helmet_base(WHITE, hex_to_rgba('#0C2340'))
    BLUE_LIGHT = hex_to_rgba('#4B92DB')
    RED_TEN = hex_to_rgba('#C60C30')
    ten[4][4] = BLUE_LIGHT; ten[4][5] = BLUE_LIGHT; ten[4][6] = hex_to_rgba('#0C2340'); ten[4][7] = hex_to_rgba('#0C2340'); ten[4][8] = hex_to_rgba('#0C2340'); ten[4][9] = hex_to_rgba('#0C2340')
    ten[5][3] = RED_TEN; ten[5][4] = BLUE_LIGHT; ten[5][5] = hex_to_rgba('#0C2340'); ten[5][6] = WHITE; ten[5][7] = WHITE; ten[5][8] = hex_to_rgba('#0C2340'); ten[5][9] = hex_to_rgba('#0C2340')
    ten[6][3] = BLUE_LIGHT; ten[6][4] = BLUE_LIGHT; ten[6][5] = hex_to_rgba('#0C2340'); ten[6][6] = hex_to_rgba('#0C2340'); ten[6][7] = hex_to_rgba('#0C2340'); ten[6][8] = hex_to_rgba('#0C2340'); ten[6][9] = hex_to_rgba('#0C2340')
    ten[7][4] = RED_TEN; ten[7][5] = BLUE_LIGHT; ten[7][6] = hex_to_rgba('#0C2340'); ten[7][7] = RED_TEN; ten[7][8] = RED_TEN; ten[7][9] = hex_to_rgba('#0C2340')
    ten[8][5] = BLUE_LIGHT; ten[8][6] = hex_to_rgba('#0C2340'); ten[8][7] = hex_to_rgba('#0C2340'); ten[8][8] = hex_to_rgba('#0C2340')

    # 32. WASHINGTON (Batch 2 - Burgundy shell, Gold ring with arrow feather, Gold facemask)
    GOLD_WSH = hex_to_rgba('#FFB612')
    wsh = build_helmet_base(hex_to_rgba('#6B1D2F'), GOLD_WSH)
    wsh[3][6] = GOLD_WSH; wsh[3][7] = GOLD_WSH; wsh[3][8] = GOLD_WSH
    wsh[4][5] = GOLD_WSH; wsh[4][6] = hex_to_rgba('#6B1D2F'); wsh[4][7] = hex_to_rgba('#6B1D2F'); wsh[4][8] = hex_to_rgba('#6B1D2F'); wsh[4][9] = GOLD_WSH
    wsh[5][5] = GOLD_WSH; wsh[5][6] = hex_to_rgba('#6B1D2F'); wsh[5][7] = GOLD_WSH; wsh[5][8] = hex_to_rgba('#6B1D2F'); wsh[5][9] = GOLD_WSH
    wsh[6][5] = GOLD_WSH; wsh[6][6] = hex_to_rgba('#6B1D2F'); wsh[6][7] = hex_to_rgba('#6B1D2F'); wsh[6][8] = hex_to_rgba('#6B1D2F'); wsh[6][9] = GOLD_WSH
    wsh[7][6] = GOLD_WSH; wsh[7][7] = GOLD_WSH; wsh[7][8] = GOLD_WSH
    wsh[8][7] = GOLD_WSH; wsh[8][8] = GOLD_WSH; wsh[8][9] = GOLD_WSH

    teams = {
        'ARI': (ari, ['Arizona']),
        'ATL': (atl, ['Atlanta']),
        'BAL': (bal, ['Baltimore']),
        'BUF': (buf, ['Buffalo']),
        'CAR': (car, ['Carolina']),
        'CHI': (chi, ['Chicago']),
        'CIN': (cin, ['Cincinnati']),
        'CLE': (cle, ['Cleveland']),
        'DAL': (dal, ['Dallas']),
        'DEN': (den, ['Denver']),
        'DET': (det, ['Detroit']),
        'GB': (gb, ['GreenBay', 'Green_Bay']),
        'HOU': (hou, ['Houston']),
        'IND': (ind, ['Indianapolis']),
        'JAX': (jax, ['Jacksonville']),
        'KC': (kc, ['KansasCity', 'Kansas_City']),
        'LAR': (lar, ['LosAngeles', 'Los_Angeles_Rams', 'Los_Angeles']),
        'MIA': (mia, ['Miami']),
        'MIN': (min_v, ['Minnesota']),
        'NE': (ne, ['NewEngland', 'New_England']),
        'NO': (no_s, ['NewOrleans', 'New_Orleans']),
        'NYG': (nyg, ['NewYorkN', 'New_York_Giants']),
        'NYJ': (nyj, ['NewYorkA', 'New_York_Jets']),
        'LV': (lv, ['Oakland', 'LasVegas', 'Las_Vegas']),
        'PHI': (phi, ['Philadelphia']),
        'PIT': (pit, ['Pittsburgh']),
        'LAC': (lac, ['SanDiego', 'Los_Angeles_Chargers', 'San_Diego']),
        'SF': (sf, ['SanFrancisco', 'San_Francisco']),
        'SEA': (sea, ['Seattle']),
        'TB': (tb, ['TampaBay', 'Tampa_Bay']),
        'TEN': (ten, ['Tennessee']),
        'WSH': (wsh, ['Washington', 'WAS']),
    }

    for code, (grid, aliases) in teams.items():
        png_data = make_png(16, 16, grid)
        with open(f'public/helmets/{code}.png', 'wb') as f:
            f.write(png_data)
        for alias in aliases:
            with open(f'public/helmets/{alias}.png', 'wb') as f:
                f.write(png_data)
        print(f"Generated {code}.png + aliases: {aliases}")

if __name__ == '__main__':
    generate_all()
