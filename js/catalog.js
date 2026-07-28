/* =========================================================================
   CATÁLOGO DE EXERCÍCIOS
   EX tem nome, tipo e observações. META tem padrão de movimento, músculos
   com peso, equipamento exigido, articulações que carrega, complexidade e
   marcação de isolamento. EQUIP lista o que existe disponível em cada lugar.
   type: 'reps' (carga x repetições) | 'time' (segundos) | 'dist' (metros)
   ========================================================================= */

const EX = {
  supino_reto:        {name:'Supino reto barra', type:'reps', group:'peito', note:'Escápulas retraídas, cotovelo a cerca de 45 graus. Progressão: suba 2,5 a 5% quando bater RIR 2 em todas as séries por duas sessões seguidas.', alts:['supino_maquina','supino_halteres']},
  supino_maquina:     {name:'Supino em máquina pegada neutra', type:'reps', group:'peito'},
  supino_halteres:    {name:'Supino reto halteres', type:'reps', group:'peito'},
  supino_incl_hal:    {name:'Supino inclinado halteres', type:'reps', group:'peito', alts:['supino_incl_barra']},
  supino_incl_barra:  {name:'Supino inclinado barra', type:'reps', group:'peito', alts:['supino_incl_hal']},
  crucifixo:          {name:'Crucifixo halteres ou peck deck', type:'reps', group:'peito', note:'Dor no ombro: troque por cross over com cabo baixo.', alts:['crossover']},
  crossover:          {name:'Cross over cabo baixo', type:'reps', group:'peito'},

  remada_curvada:     {name:'Remada curvada barra', type:'reps', group:'costas', note:'Puxe com o cotovelo, tronco firme, sem balanço.', alts:['remada_cavalinho','remada_baixa']},
  remada_cavalinho:   {name:'Remada cavalinho apoiada', type:'reps', group:'costas'},
  remada_baixa:       {name:'Remada baixa pegada neutra', type:'reps', group:'costas'},
  remada_unilateral:  {name:'Remada unilateral halteres', type:'reps', group:'costas'},
  puxada_pronada:     {name:'Puxada pegada pronada aberta', type:'reps', group:'costas', alts:['pulldown_neutro','barra_fixa']},
  pulldown_neutro:    {name:'Pulldown pegada neutra', type:'reps', group:'costas'},
  barra_fixa:         {name:'Barra fixa ou puxada supinada', type:'reps', group:'costas', note:'Dor no ombro: troque por remada baixa neutra.', alts:['remada_baixa','pulldown_neutro']},

  desenv_militar:     {name:'Desenvolvimento militar em pé', type:'reps', group:'ombro', alts:['desenv_halteres']},
  desenv_halteres:    {name:'Desenvolvimento halteres sentado', type:'reps', group:'ombro', alts:['desenv_militar']},
  elevacao_lateral:   {name:'Elevação lateral', type:'reps', group:'ombro'},
  face_pull:          {name:'Face pull na polia', type:'reps', group:'ombro'},

  rosca_direta:       {name:'Rosca direta barra reta', type:'reps', group:'bíceps', alts:['rosca_alternada','rosca_scott']},
  rosca_alternada:    {name:'Rosca alternada halteres', type:'reps', group:'bíceps'},
  rosca_martelo:      {name:'Rosca martelo', type:'reps', group:'bíceps'},
  rosca_scott:        {name:'Rosca scott', type:'reps', group:'bíceps'},
  triceps_corda:      {name:'Tríceps corda na polia', type:'reps', group:'tríceps', alts:['triceps_testa']},
  triceps_testa:      {name:'Tríceps testa', type:'reps', group:'tríceps', alts:['triceps_corda']},
  triceps_mergulho:   {name:'Mergulho no banco ou paralelas', type:'reps', group:'tríceps'},

  fecho_pegada:       {name:'Fecho de pegada na barra fixa', type:'time', group:'pegada', note:'Trabalho direto de pegada e antebraço. Segure a barra o máximo que aguentar, sem balançar.'},
  farmer:             {name:'Farmer carry', type:'dist', group:'pegada', note:'Pegada firme, ombro para trás, passo curto.'},

  agachamento:        {name:'Agachamento livre barra', type:'reps', group:'quadríceps', note:'Quadril e joelho descem juntos, joelho segue a direção do pé. Dor no joelho: troque por Smith ou leg press com pés mais altos.', alts:['agach_smith','leg_press','hack']},
  agach_smith:        {name:'Agachamento no Smith', type:'reps', group:'quadríceps'},
  agach_frontal:      {name:'Agachamento frontal ou hack machine', type:'reps', group:'quadríceps', alts:['hack','agach_smith']},
  hack:               {name:'Hack machine', type:'reps', group:'quadríceps'},
  leg_press:          {name:'Leg press 45 graus', type:'reps', group:'quadríceps', alts:['leg_press_alto','hack']},
  leg_press_alto:     {name:'Leg press pés altos', type:'reps', group:'quadríceps'},
  extensora:          {name:'Cadeira extensora', type:'reps', group:'quadríceps'},
  bulgaro:            {name:'Afundo búlgaro halteres', type:'reps', group:'quadríceps', alts:['leg_press','passada']},
  passada:            {name:'Passada com halteres', type:'reps', group:'quadríceps'},

  terra_romeno:       {name:'Levantamento terra romeno', type:'reps', group:'posterior', note:'Quadril vai para trás primeiro, barra roça a perna, coluna neutra. Dor lombar: troque por cadeira flexora e glúteo na polia baixa.', alts:['stiff','flexora','gluteo_polia']},
  stiff:              {name:'Stiff halteres', type:'reps', group:'posterior'},
  flexora:            {name:'Cadeira flexora', type:'reps', group:'posterior'},
  gluteo_polia:       {name:'Glúteo na polia baixa', type:'reps', group:'posterior'},
  hip_thrust:         {name:'Hip thrust barra', type:'reps', group:'posterior', alts:['gluteo_polia']},

  panturrilha_pe:     {name:'Panturrilha em pé', type:'reps', group:'panturrilha', alts:['panturrilha_sent']},
  panturrilha_sent:   {name:'Panturrilha sentado', type:'reps', group:'panturrilha', alts:['panturrilha_pe']},

  prancha:            {name:'Prancha abdominal', type:'time', group:'core'},
  prancha_lateral:    {name:'Prancha lateral', type:'time', group:'core'},
  abdominal_polia:    {name:'Abdominal na polia', type:'reps', group:'core'},

  esteira_inclinada:  {name:'Esteira caminhada inclinada', type:'cardio', group:'cardio'},
  esteira_corrida:    {name:'Esteira corrida', type:'cardio', group:'cardio'},
  bike_ergometrica:   {name:'Bicicleta ergométrica', type:'cardio', group:'cardio'},
  eliptico:           {name:'Elíptico', type:'cardio', group:'cardio'},
  remo_ergometro:     {name:'Remo ergômetro', type:'cardio', group:'cardio'},
  escada_ergometrica: {name:'Escada ergométrica', type:'cardio', group:'cardio'},
  corda_pular:        {name:'Corda', type:'cardio', group:'cardio'},
  caminhada_externa:  {name:'Caminhada ao ar livre', type:'cardio', group:'cardio'},

  supino_declinado:        {name:'Supino declinado barra', type:'reps', group:'peito'},
  crucifixo_inclinado:     {name:'Crucifixo inclinado halteres', type:'reps', group:'peito'},
  peck_deck:               {name:'Peck deck (voador)', type:'reps', group:'peito'},
  pullover:                {name:'Pullover halteres', type:'reps', group:'costas'},
  supino_halteres_unilateral: {name:'Supino unilateral com halteres', type:'reps', group:'peito'},
  crossover_unilateral:    {name:'Crossover unilateral na polia', type:'reps', group:'peito'},
  flexao_declinada:        {name:'Flexão declinada', type:'reps', group:'peito'},
  flexao_joelho:           {name:'Flexão com joelho apoiado', type:'reps', group:'peito'},
  supino_maquina_convergente: {name:'Supino em máquina convergente', type:'reps', group:'peito'},

  desenvolvimento_arnold:  {name:'Desenvolvimento Arnold', type:'reps', group:'ombro'},
  elevacao_frontal:        {name:'Elevação frontal', type:'reps', group:'ombro'},
  crucifixo_inverso:       {name:'Crucifixo inverso', type:'reps', group:'ombro'},
  remada_alta:             {name:'Remada alta barra', type:'reps', group:'ombro'},
  remada_alta_halteres:    {name:'Remada alta com halteres', type:'reps', group:'ombro'},
  desenv_halteres_unilateral: {name:'Desenvolvimento unilateral com halteres', type:'reps', group:'ombro'},
  elevacao_lateral_unilateral: {name:'Elevação lateral unilateral', type:'reps', group:'ombro'},
  elevacao_frontal_unilateral: {name:'Elevação frontal unilateral', type:'reps', group:'ombro'},
  desenvolvimento_maquina: {name:'Desenvolvimento de ombro na máquina', type:'reps', group:'ombro'},

  remada_serrote:          {name:'Remada serrote', type:'reps', group:'costas'},
  remada_t:                {name:'Remada T', type:'reps', group:'costas'},
  encolhimento_trapezio:   {name:'Encolhimento de trapézio', type:'reps', group:'costas'},
  remada_baixa_unilateral: {name:'Remada baixa unilateral na polia', type:'reps', group:'costas'},
  remada_maquina_unilateral: {name:'Remada unilateral na máquina', type:'reps', group:'costas'},
  puxada_unilateral:       {name:'Puxada unilateral na polia', type:'reps', group:'costas'},
  remada_barra_supinada:   {name:'Remada curvada pegada supinada', type:'reps', group:'costas'},

  rosca_concentrada:       {name:'Rosca concentrada', type:'reps', group:'bíceps'},
  rosca_inversa:           {name:'Rosca inversa barra', type:'reps', group:'bíceps'},
  rosca_21:                {name:'Rosca 21', type:'reps', group:'bíceps'},
  rosca_punho:             {name:'Rosca de punho', type:'reps', group:'bíceps'},
  rosca_unilateral_halteres: {name:'Rosca direta unilateral com halter', type:'reps', group:'bíceps'},
  rosca_martelo_unilateral: {name:'Rosca martelo unilateral', type:'reps', group:'bíceps'},
  rosca_scott_unilateral:  {name:'Rosca Scott unilateral', type:'reps', group:'bíceps'},
  rosca_barra_w:           {name:'Rosca com barra W', type:'reps', group:'bíceps'},
  rosca_zottman:           {name:'Rosca Zottman', type:'reps', group:'bíceps'},
  triceps_frances:         {name:'Tríceps francês', type:'reps', group:'tríceps'},
  triceps_banco:           {name:'Tríceps no banco', type:'reps', group:'tríceps'},
  triceps_unilateral:      {name:'Tríceps unilateral na polia', type:'reps', group:'tríceps'},
  triceps_corda_unilateral: {name:'Tríceps corda unilateral', type:'reps', group:'tríceps'},
  triceps_frances_unilateral: {name:'Tríceps francês unilateral', type:'reps', group:'tríceps'},
  triceps_testa_unilateral: {name:'Tríceps testa unilateral', type:'reps', group:'tríceps'},
  triceps_coice:           {name:'Tríceps coice halteres', type:'reps', group:'tríceps'},

  agachamento_sumo:        {name:'Agachamento sumô', type:'reps', group:'quadríceps'},
  leg_press_unilateral:    {name:'Leg press unilateral', type:'reps', group:'quadríceps'},
  cadeira_adutora:         {name:'Cadeira adutora', type:'reps', group:'quadríceps'},
  cadeira_abdutora:        {name:'Cadeira abdutora', type:'reps', group:'posterior'},
  panturrilha_leg_press:   {name:'Panturrilha no leg press', type:'reps', group:'panturrilha'},
  terra_convencional:      {name:'Levantamento terra convencional', type:'reps', group:'posterior'},
  terra_sumo:              {name:'Levantamento terra sumô', type:'reps', group:'posterior'},
  avanco_smith:            {name:'Avanço no Smith', type:'reps', group:'quadríceps'},
  hack_unilateral:         {name:'Hack machine unilateral', type:'reps', group:'quadríceps'},
  extensora_unilateral:    {name:'Cadeira extensora unilateral', type:'reps', group:'quadríceps'},
  flexora_unilateral:      {name:'Cadeira flexora unilateral', type:'reps', group:'posterior'},
  rdl_unilateral:          {name:'Levantamento terra romeno unilateral', type:'reps', group:'posterior'},
  hip_thrust_unilateral:   {name:'Hip thrust unilateral', type:'reps', group:'posterior'},
  ponte_gluteo_unilateral: {name:'Ponte de glúteo unilateral', type:'reps', group:'posterior'},
  elevacao_pelvica_maquina: {name:'Elevação pélvica em máquina', type:'reps', group:'posterior'},
  afundo_halteres_caminhando: {name:'Afundo caminhando com halteres', type:'reps', group:'quadríceps'},
  bulgaro_smith:           {name:'Agachamento búlgaro no Smith', type:'reps', group:'quadríceps'},
  agachamento_taca:        {name:'Agachamento taça', type:'reps', group:'quadríceps'},
  step_up:                 {name:'Step up com halteres', type:'reps', group:'quadríceps'},
  afundo_reverso:          {name:'Afundo reverso peso corporal', type:'reps', group:'quadríceps'},
  good_morning_barra:      {name:'Good morning com barra', type:'reps', group:'posterior'},
  gluteo_4_apoios:         {name:'Glúteo em 4 apoios', type:'reps', group:'posterior'},
  gluteo_caneleira:        {name:'Glúteo com caneleira', type:'reps', group:'posterior'},
  panturrilha_unilateral_corpo: {name:'Panturrilha unilateral peso corporal', type:'reps', group:'panturrilha'},
  panturrilha_smith:       {name:'Panturrilha no Smith', type:'reps', group:'panturrilha'},
  panturrilha_burro:       {name:'Panturrilha burro', type:'reps', group:'panturrilha'},

  abdominal_infra:         {name:'Abdominal infra', type:'reps', group:'core'},
  elevacao_pernas_suspenso: {name:'Elevação de pernas suspenso', type:'reps', group:'core'},
  roda_abdominal:          {name:'Roda abdominal', type:'reps', group:'core'},
  prancha_elevacao_membro: {name:'Prancha com elevação de membro', type:'time', group:'core'},
  abdominal_bicicleta:     {name:'Abdominal bicicleta', type:'reps', group:'core'},
  abdominal_canivete:      {name:'Abdominal canivete', type:'reps', group:'core'},
  prancha_dinamica:        {name:'Prancha dinâmica', type:'time', group:'core'},
  russian_twist:           {name:'Abdominal russo', type:'reps', group:'core'},
  superman:                {name:'Superman', type:'reps', group:'core'},
  hiperextensao_banco:     {name:'Hiperextensão no banco romano', type:'reps', group:'core'},
  abdominal_maquina:       {name:'Abdominal na máquina', type:'reps', group:'core'},

  farmer_unilateral:       {name:'Farmer carry unilateral', type:'dist', group:'pegada'}
};

const META = {
  supino_reto:       {p:'emp_h', m:{peito:1, triceps:.5, ombro:.5}, e:['barra','banco'], s:['ombro','punho'], c:3},
  supino_maquina:    {p:'emp_h', m:{peito:1, triceps:.5}, e:['maquina'], s:[], c:1},
  supino_halteres:   {p:'emp_h', m:{peito:1, triceps:.5, ombro:.5}, e:['halter','banco'], s:['ombro'], c:2},
  supino_incl_hal:   {p:'emp_h', m:{peito:1, ombro:.5, triceps:.5}, e:['halter','banco'], s:['ombro'], c:2},
  supino_incl_barra: {p:'emp_h', m:{peito:1, ombro:.5, triceps:.5}, e:['barra','banco'], s:['ombro','punho'], c:3},
  crucifixo:         {p:'emp_h', m:{peito:1}, e:['halter','banco'], s:['ombro'], c:2},
  crossover:         {p:'emp_h', m:{peito:1}, e:['polia'], s:['ombro'], c:1},
  flexao:            {p:'emp_h', m:{peito:1, triceps:.5, ombro:.5}, e:['corpo'], s:['punho','ombro'], c:1},
  flexao_inclinada:  {p:'emp_h', m:{peito:1, triceps:.5}, e:['corpo'], s:['punho'], c:1},
  flexao_elastico:   {p:'emp_h', m:{peito:1, triceps:.5}, e:['elastico'], s:['punho'], c:1},

  desenv_militar:    {p:'emp_v', m:{ombro:1, triceps:.5}, e:['barra'], s:['ombro','punho','lombar'], c:3},
  desenv_halteres:   {p:'emp_v', m:{ombro:1, triceps:.5}, e:['halter'], s:['ombro'], c:2},
  desenv_elastico:   {p:'emp_v', m:{ombro:1, triceps:.5}, e:['elastico'], s:['ombro'], c:1},
  pike_pushup:       {p:'emp_v', m:{ombro:1, triceps:.5}, e:['corpo'], s:['ombro','punho'], c:2},

  remada_curvada:    {p:'pux_h', m:{costas:1, biceps:.5}, e:['barra'], s:['lombar'], c:3},
  remada_cavalinho:  {p:'pux_h', m:{costas:1, biceps:.5}, e:['maquina'], s:[], c:2},
  remada_baixa:      {p:'pux_h', m:{costas:1, biceps:.5}, e:['polia'], s:[], c:1},
  remada_unilateral: {p:'pux_h', m:{costas:1, biceps:.5}, e:['halter','banco'], s:[], c:2, u:true},
  remada_halteres:   {p:'pux_h', m:{costas:1, biceps:.5}, e:['halter'], s:['lombar'], c:2},
  remada_invertida:  {p:'pux_h', m:{costas:1, biceps:.5}, e:['corpo'], s:[], c:1},
  remada_elastico:   {p:'pux_h', m:{costas:1, biceps:.5}, e:['elastico'], s:[], c:1},

  puxada_pronada:    {p:'pux_v', m:{costas:1, biceps:.5}, e:['polia'], s:['ombro'], c:1},
  pulldown_neutro:   {p:'pux_v', m:{costas:1, biceps:.5}, e:['polia'], s:[], c:1},
  barra_fixa:        {p:'pux_v', m:{costas:1, biceps:.5}, e:['barra_fixa'], s:['ombro','cotovelo'], c:3},
  puxada_elastico:   {p:'pux_v', m:{costas:1, biceps:.5}, e:['elastico'], s:[], c:1},

  elevacao_lateral:  {p:'lateral', m:{ombro:1}, e:['halter'], s:['ombro'], c:1},
  lateral_elastico:  {p:'lateral', m:{ombro:1}, e:['elastico'], s:['ombro'], c:1},
  face_pull:         {p:'lateral', m:{ombro:1, costas:.5}, e:['polia'], s:[], c:1},

  rosca_direta:      {p:'biceps', m:{biceps:1}, e:['barra'], s:['punho','cotovelo'], c:1},
  rosca_alternada:   {p:'biceps', m:{biceps:1}, e:['halter'], s:['cotovelo'], c:1},
  rosca_martelo:     {p:'biceps', m:{biceps:1}, e:['halter'], s:['cotovelo'], c:1},
  rosca_scott:       {p:'biceps', m:{biceps:1}, e:['barra','banco'], s:['cotovelo','punho'], c:1},
  rosca_elastico:    {p:'biceps', m:{biceps:1}, e:['elastico'], s:['cotovelo'], c:1},

  triceps_corda:     {p:'triceps', m:{triceps:1}, e:['polia'], s:['cotovelo'], c:1},
  triceps_testa:     {p:'triceps', m:{triceps:1}, e:['halter','banco'], s:['cotovelo'], c:2},
  triceps_mergulho:  {p:'triceps', m:{triceps:1, peito:.5}, e:['corpo'], s:['ombro','punho'], c:2},
  flexao_diamante:   {p:'triceps', m:{triceps:1, peito:.5}, e:['corpo'], s:['punho','cotovelo'], c:1},
  triceps_elastico:  {p:'triceps', m:{triceps:1}, e:['elastico'], s:['cotovelo'], c:1},

  agachamento:       {p:'joelho', m:{quadriceps:1, gluteos:.5, core:.5}, e:['barra'], s:['joelho','lombar'], c:3},
  agach_smith:       {p:'joelho', m:{quadriceps:1, gluteos:.5}, e:['smith'], s:['joelho'], c:2},
  agach_frontal:     {p:'joelho', m:{quadriceps:1, core:.5}, e:['barra'], s:['joelho','punho'], c:3},
  hack:              {p:'joelho', m:{quadriceps:1, gluteos:.5}, e:['maquina'], s:['joelho'], c:1},
  leg_press:         {p:'joelho', m:{quadriceps:1, gluteos:.5}, e:['maquina'], s:['joelho'], c:1},
  leg_press_alto:    {p:'joelho', m:{quadriceps:.5, gluteos:1}, e:['maquina'], s:['joelho'], c:1},
  extensora:         {p:'joelho', m:{quadriceps:1}, e:['maquina'], s:['joelho'], c:1},
  bulgaro:           {p:'joelho', m:{quadriceps:1, gluteos:1}, e:['halter','banco'], s:['joelho'], c:2, u:true},
  passada:           {p:'joelho', m:{quadriceps:1, gluteos:1}, e:['halter'], s:['joelho'], c:2, u:true},
  agach_corpo:       {p:'joelho', m:{quadriceps:1, gluteos:.5}, e:['corpo'], s:['joelho'], c:1},
  afundo_corpo:      {p:'joelho', m:{quadriceps:1, gluteos:1}, e:['corpo'], s:['joelho'], c:1, u:true},
  agach_bulgaro_corpo:{p:'joelho', m:{quadriceps:1, gluteos:1}, e:['corpo'], s:['joelho'], c:2, u:true},

  terra_romeno:      {p:'quadril', m:{posterior:1, gluteos:1, lombar:.5}, e:['barra'], s:['lombar'], c:3},
  stiff:             {p:'quadril', m:{posterior:1, gluteos:.5}, e:['halter'], s:['lombar'], c:2},
  flexora:           {p:'quadril', m:{posterior:1}, e:['maquina'], s:['joelho'], c:1},
  gluteo_polia:      {p:'quadril', m:{gluteos:1}, e:['polia'], s:[], c:1, u:true},
  hip_thrust:        {p:'quadril', m:{gluteos:1, posterior:.5}, e:['barra','banco'], s:[], c:2},
  ponte_gluteo:      {p:'quadril', m:{gluteos:1, posterior:.5}, e:['corpo'], s:[], c:1},
  elevacao_pelvica:  {p:'quadril', m:{gluteos:1, posterior:.5}, e:['corpo','banco'], s:[], c:1},
  good_morning_elast:{p:'quadril', m:{posterior:1, gluteos:.5}, e:['elastico'], s:['lombar'], c:1},

  panturrilha_pe:    {p:'panturrilha', m:{panturrilha:1}, e:['maquina'], s:['tornozelo'], c:1},
  panturrilha_sent:  {p:'panturrilha', m:{panturrilha:1}, e:['maquina'], s:['tornozelo'], c:1},
  panturrilha_corpo: {p:'panturrilha', m:{panturrilha:1}, e:['corpo'], s:['tornozelo'], c:1},
  panturrilha_halter:{p:'panturrilha', m:{panturrilha:1}, e:['halter'], s:['tornozelo'], c:1},

  prancha:           {p:'core', m:{core:1}, e:['corpo'], s:['ombro'], c:1},
  prancha_lateral:   {p:'core', m:{core:1}, e:['corpo'], s:['ombro'], c:1},
  abdominal_polia:   {p:'core', m:{core:1}, e:['polia'], s:[], c:1},
  abdominal_solo:    {p:'core', m:{core:1}, e:['corpo'], s:[], c:1},
  bird_dog:          {p:'core', m:{core:1}, e:['corpo'], s:[], c:1},

  fecho_pegada:      {p:'pegada', m:{}, e:['barra_fixa'], s:['cotovelo','punho'], c:1},
  farmer:            {p:'pegada', m:{core:.5}, e:['halter'], s:['punho'], c:1},

  esteira_inclinada:  {p:'cardio', m:{}, e:['cardio'], s:[], c:1},
  esteira_corrida:    {p:'cardio', m:{}, e:['cardio'], s:['joelho','tornozelo'], c:1},
  bike_ergometrica:   {p:'cardio', m:{}, e:['cardio'], s:['joelho'], c:1},
  eliptico:           {p:'cardio', m:{}, e:['cardio'], s:[], c:1},
  remo_ergometro:     {p:'cardio', m:{}, e:['cardio'], s:['lombar'], c:1},
  escada_ergometrica: {p:'cardio', m:{}, e:['cardio'], s:['joelho'], c:1},
  corda_pular:        {p:'cardio', m:{}, e:['corpo'], s:['joelho','tornozelo'], c:1},
  caminhada_externa:  {p:'cardio', m:{}, e:['corpo'], s:[], c:1},

  supino_declinado:        {p:'emp_h', m:{peito:1, triceps:.5, ombro:.2}, e:['barra','banco'], s:['ombro','punho'], c:3},
  crucifixo_inclinado:     {p:'emp_h', m:{peito:1, ombro:.3}, e:['halter','banco'], s:['ombro'], c:2},
  peck_deck:               {p:'emp_h', m:{peito:1}, e:['maquina'], s:['ombro'], c:1},
  pullover:                {p:'pux_v', m:{costas:.7, peito:.5, triceps:.3}, e:['halter','banco'], s:['ombro'], c:2},
  supino_halteres_unilateral: {p:'emp_h', m:{peito:1, triceps:.5, ombro:.5}, e:['halter','banco'], s:['ombro'], c:2, u:true},
  crossover_unilateral:    {p:'emp_h', m:{peito:1}, e:['polia'], s:['ombro'], c:1, u:true},
  flexao_declinada:        {p:'emp_h', m:{peito:1, ombro:1, triceps:.5}, e:['corpo','banco'], s:['punho','ombro'], c:2},
  flexao_joelho:           {p:'emp_h', m:{peito:1, triceps:.5, ombro:.3}, e:['corpo'], s:['punho'], c:1},
  supino_maquina_convergente: {p:'emp_h', m:{peito:1, triceps:.5}, e:['maquina'], s:[], c:1},

  desenvolvimento_arnold:  {p:'emp_v', m:{ombro:1, triceps:.5}, e:['halter'], s:['ombro'], c:2},
  elevacao_frontal:        {p:'lateral', m:{ombro:1}, e:['halter'], s:['ombro'], c:1},
  crucifixo_inverso:       {p:'lateral', m:{ombro:1, costas:.3}, e:['halter'], s:['ombro'], c:1},
  remada_alta:             {p:'lateral', m:{ombro:1, costas:.3}, e:['barra'], s:['ombro','punho'], c:2},
  remada_alta_halteres:    {p:'lateral', m:{ombro:1, costas:.3}, e:['halter'], s:['ombro','punho'], c:2},
  desenv_halteres_unilateral: {p:'emp_v', m:{ombro:1, triceps:.5}, e:['halter'], s:['ombro'], c:2, u:true},
  elevacao_lateral_unilateral: {p:'lateral', m:{ombro:1}, e:['halter'], s:['ombro'], c:1, u:true},
  elevacao_frontal_unilateral: {p:'lateral', m:{ombro:1}, e:['halter'], s:['ombro'], c:1, u:true},
  desenvolvimento_maquina: {p:'emp_v', m:{ombro:1, triceps:.5}, e:['maquina'], s:['ombro'], c:1},

  remada_serrote:          {p:'pux_h', m:{costas:1, biceps:.5}, e:['halter','banco'], s:[], c:2, u:true},
  remada_t:                {p:'pux_h', m:{costas:1, biceps:.5}, e:['maquina'], s:['lombar'], c:2},
  encolhimento_trapezio:   {p:'trapezio', m:{costas:1}, e:['barra'], s:[], c:1},
  remada_baixa_unilateral: {p:'pux_h', m:{costas:1, biceps:.5}, e:['polia'], s:[], c:2, u:true},
  remada_maquina_unilateral: {p:'pux_h', m:{costas:1, biceps:.5}, e:['maquina'], s:[], c:2, u:true},
  puxada_unilateral:       {p:'pux_v', m:{costas:1, biceps:.5}, e:['polia'], s:['ombro'], c:2, u:true},
  remada_barra_supinada:   {p:'pux_h', m:{costas:1, biceps:1}, e:['barra'], s:['lombar','cotovelo'], c:3},

  rosca_concentrada:       {p:'biceps', m:{biceps:1}, e:['halter','banco'], s:['cotovelo'], c:1},
  rosca_inversa:           {p:'biceps', m:{biceps:1}, e:['barra'], s:['punho','cotovelo'], c:1},
  rosca_21:                {p:'biceps', m:{biceps:1}, e:['barra'], s:['cotovelo','punho'], c:2},
  rosca_punho:             {p:'punho', m:{}, e:['halter','banco'], s:['punho'], c:1},
  rosca_unilateral_halteres: {p:'biceps', m:{biceps:1}, e:['halter'], s:['cotovelo'], c:1, u:true},
  rosca_martelo_unilateral: {p:'biceps', m:{biceps:1}, e:['halter'], s:['cotovelo'], c:1, u:true},
  rosca_scott_unilateral:  {p:'biceps', m:{biceps:1}, e:['halter','banco'], s:['cotovelo'], c:1, u:true},
  rosca_barra_w:           {p:'biceps', m:{biceps:1}, e:['barra'], s:['punho','cotovelo'], c:1},
  rosca_zottman:           {p:'biceps', m:{biceps:1}, e:['halter'], s:['punho','cotovelo'], c:2},
  triceps_frances:         {p:'triceps', m:{triceps:1}, e:['halter'], s:['cotovelo','ombro'], c:2},
  triceps_banco:           {p:'triceps', m:{triceps:1, peito:.3}, e:['corpo','banco'], s:['ombro','punho'], c:1},
  triceps_unilateral:      {p:'triceps', m:{triceps:1}, e:['polia'], s:['cotovelo'], c:1, u:true},
  triceps_corda_unilateral: {p:'triceps', m:{triceps:1}, e:['polia'], s:['cotovelo'], c:1, u:true},
  triceps_frances_unilateral: {p:'triceps', m:{triceps:1}, e:['halter'], s:['cotovelo','ombro'], c:2, u:true},
  triceps_testa_unilateral: {p:'triceps', m:{triceps:1}, e:['halter'], s:['cotovelo'], c:2, u:true},
  triceps_coice:           {p:'triceps', m:{triceps:1}, e:['halter','banco'], s:['cotovelo'], c:1, u:true},

  agachamento_sumo:        {p:'quadril', m:{gluteos:1, quadriceps:.7, posterior:.3}, e:['barra'], s:['joelho','lombar'], c:3},
  leg_press_unilateral:    {p:'joelho', m:{quadriceps:1, gluteos:.5}, e:['maquina'], s:['joelho'], c:2, u:true},
  cadeira_adutora:         {p:'quadril', m:{gluteos:.5}, e:['maquina'], s:['joelho'], c:1},
  cadeira_abdutora:        {p:'quadril', m:{gluteos:1}, e:['maquina'], s:['joelho'], c:1},
  panturrilha_leg_press:   {p:'panturrilha', m:{panturrilha:1}, e:['maquina'], s:['tornozelo'], c:1},
  terra_convencional:      {p:'quadril', m:{posterior:1, gluteos:1, lombar:.7, quadriceps:.3}, e:['barra'], s:['lombar','joelho'], c:3},
  terra_sumo:              {p:'quadril', m:{gluteos:1, posterior:.7, quadriceps:.5, lombar:.5}, e:['barra'], s:['lombar','joelho'], c:3},
  avanco_smith:            {p:'joelho', m:{quadriceps:1, gluteos:1}, e:['smith'], s:['joelho'], c:2, u:true},
  hack_unilateral:         {p:'joelho', m:{quadriceps:1, gluteos:.5}, e:['maquina'], s:['joelho'], c:2, u:true},
  extensora_unilateral:    {p:'joelho', m:{quadriceps:1}, e:['maquina'], s:['joelho'], c:1, u:true},
  flexora_unilateral:      {p:'quadril', m:{posterior:1}, e:['maquina'], s:['joelho'], c:1, u:true},
  rdl_unilateral:          {p:'quadril', m:{posterior:1, gluteos:1}, e:['halter'], s:['lombar','joelho'], c:3, u:true},
  hip_thrust_unilateral:   {p:'quadril', m:{gluteos:1, posterior:.5}, e:['halter'], s:['joelho'], c:2, u:true},
  ponte_gluteo_unilateral: {p:'quadril', m:{gluteos:1, posterior:.5}, e:['corpo'], s:[], c:1, u:true},
  elevacao_pelvica_maquina: {p:'quadril', m:{gluteos:1, posterior:.3}, e:['maquina'], s:[], c:1},
  afundo_halteres_caminhando: {p:'joelho', m:{quadriceps:1, gluteos:1}, e:['halter'], s:['joelho'], c:2, u:true},
  bulgaro_smith:           {p:'joelho', m:{quadriceps:1, gluteos:1}, e:['smith'], s:['joelho'], c:2, u:true},
  agachamento_taca:        {p:'joelho', m:{quadriceps:1, gluteos:.5, core:.3}, e:['halter'], s:['joelho'], c:1},
  step_up:                 {p:'joelho', m:{quadriceps:1, gluteos:1}, e:['halter','banco'], s:['joelho'], c:2, u:true},
  afundo_reverso:          {p:'joelho', m:{quadriceps:1, gluteos:1}, e:['corpo'], s:['joelho'], c:1, u:true},
  good_morning_barra:      {p:'quadril', m:{posterior:1, gluteos:.5, lombar:.5}, e:['barra'], s:['lombar'], c:3},
  gluteo_4_apoios:         {p:'quadril', m:{gluteos:1}, e:['corpo'], s:[], c:1},
  gluteo_caneleira:        {p:'quadril', m:{gluteos:1}, e:['corpo'], s:[], c:1, u:true},
  panturrilha_unilateral_corpo: {p:'panturrilha', m:{panturrilha:1}, e:['corpo'], s:['tornozelo'], c:1, u:true},
  panturrilha_smith:       {p:'panturrilha', m:{panturrilha:1}, e:['smith'], s:['tornozelo'], c:1},
  panturrilha_burro:       {p:'panturrilha', m:{panturrilha:1}, e:['maquina'], s:['tornozelo'], c:2},

  abdominal_infra:         {p:'core', m:{core:1}, e:['corpo'], s:['lombar'], c:1},
  elevacao_pernas_suspenso: {p:'core', m:{core:1}, e:['barra_fixa'], s:['ombro','lombar'], c:2},
  roda_abdominal:          {p:'core', m:{core:1, ombro:.3}, e:['corpo'], s:['lombar','ombro'], c:3},
  prancha_elevacao_membro: {p:'core', m:{core:1, gluteos:.3}, e:['corpo'], s:['ombro'], c:2},
  abdominal_bicicleta:     {p:'core', m:{core:1}, e:['corpo'], s:['lombar'], c:1},
  abdominal_canivete:      {p:'core', m:{core:1}, e:['corpo'], s:['lombar'], c:2},
  prancha_dinamica:        {p:'core', m:{core:1, ombro:.3}, e:['corpo'], s:['ombro'], c:2},
  russian_twist:           {p:'core', m:{core:1}, e:['corpo'], s:['lombar'], c:1},
  superman:                {p:'core', m:{core:1}, e:['corpo'], s:['lombar'], c:1},
  hiperextensao_banco:     {p:'core', m:{core:1, posterior:.5}, e:['maquina'], s:['lombar'], c:2},
  abdominal_maquina:       {p:'core', m:{core:1}, e:['maquina'], s:[], c:1},

  farmer_unilateral:       {p:'pegada', m:{core:.5}, e:['halter'], s:['punho'], c:1, u:true}
};

/* isolamento: nunca deve ocupar o lugar de exercício principal */
['crucifixo','crossover','elevacao_lateral','lateral_elastico','face_pull','rosca_direta','rosca_alternada',
 'rosca_martelo','rosca_scott','rosca_elastico','triceps_corda','triceps_testa','triceps_elastico',
 'flexao_diamante','extensora','flexora','gluteo_polia','panturrilha_pe','panturrilha_sent','panturrilha_corpo',
 'panturrilha_halter','prancha','prancha_lateral','abdominal_polia','abdominal_solo','bird_dog',
 'fecho_pegada','farmer',
 'peck_deck','crossover_unilateral','elevacao_frontal','crucifixo_inverso','elevacao_lateral_unilateral',
 'elevacao_frontal_unilateral','encolhimento_trapezio','rosca_concentrada','rosca_punho','triceps_coice',
 'cadeira_adutora','cadeira_abdutora','extensora_unilateral','flexora_unilateral','gluteo_4_apoios',
 'gluteo_caneleira','abdominal_infra','elevacao_pernas_suspenso','roda_abdominal','prancha_elevacao_membro',
 'abdominal_bicicleta','abdominal_canivete','prancha_dinamica','russian_twist','superman','abdominal_maquina',
 /* catálogo ampliado (item 5.1 do ROADMAP): variantes de padrão só isolamento
    (bíceps, tríceps, lateral de ombro, panturrilha, core, pegada) que entraram
    depois e ficaram fora desta lista. Sem a marca, nunca eram escolhidas: só
    concorrem de igual pra igual com o resto do padrão dentro de um espaço
    isolado. Mergulho e tríceps no banco ficam de fora de propósito, porque
    recrutam peito e ombro o bastante pra não contar como isolamento puro. */
 'remada_alta','remada_alta_halteres','rosca_inversa','rosca_21','rosca_unilateral_halteres',
 'rosca_martelo_unilateral','rosca_scott_unilateral','rosca_barra_w','rosca_zottman',
 'triceps_frances','triceps_unilateral','triceps_corda_unilateral','triceps_frances_unilateral',
 'triceps_testa_unilateral','panturrilha_leg_press','panturrilha_unilateral_corpo','panturrilha_smith',
 'panturrilha_burro','hiperextensao_banco','farmer_unilateral'
].forEach(id => { if(META[id]) META[id].iso = true; });

/* qualidade do equipamento, para não preferir elástico onde existe barra */
const NIVEL_EQUIP = {elastico:1, corpo:2, maquina:3, smith:3, polia:3, banco:3, cardio:3, halter:4, barra:5, barra_fixa:5};
Object.keys(META).forEach(id => {
  META[id].nivel = Math.max.apply(null, META[id].e.map(eq => NIVEL_EQUIP[eq] || 2));
});

/* exercícios que ainda não existem no catálogo principal */
const EX_EXTRA = {
  flexao:             {name:'Flexão de braço', type:'reps', group:'peito'},
  flexao_inclinada:   {name:'Flexão com mãos apoiadas', type:'reps', group:'peito', note:'Quanto mais alto o apoio, mais fácil. Comece na altura que você faz 8 repetições limpas.'},
  flexao_elastico:    {name:'Supino com elástico', type:'reps', group:'peito'},
  desenv_elastico:    {name:'Desenvolvimento com elástico', type:'reps', group:'ombro'},
  pike_pushup:        {name:'Flexão pike', type:'reps', group:'ombro', note:'Quadril alto, corpo em V. É a flexão que vira desenvolvimento de ombro.'},
  remada_halteres:    {name:'Remada curvada com halteres', type:'reps', group:'costas'},
  remada_invertida:   {name:'Remada invertida', type:'reps', group:'costas', note:'Use uma barra baixa, mesa firme ou o corrimão. Quanto mais deitado, mais difícil.'},
  remada_elastico:    {name:'Remada com elástico', type:'reps', group:'costas'},
  puxada_elastico:    {name:'Puxada alta com elástico', type:'reps', group:'costas'},
  lateral_elastico:   {name:'Elevação lateral com elástico', type:'reps', group:'ombro'},
  rosca_elastico:     {name:'Rosca com elástico', type:'reps', group:'bíceps'},
  triceps_elastico:   {name:'Tríceps com elástico', type:'reps', group:'tríceps'},
  flexao_diamante:    {name:'Flexão diamante', type:'reps', group:'tríceps'},
  agach_corpo:        {name:'Agachamento peso corporal', type:'reps', group:'quadríceps'},
  afundo_corpo:       {name:'Afundo peso corporal', type:'reps', group:'quadríceps'},
  agach_bulgaro_corpo:{name:'Agachamento búlgaro peso corporal', type:'reps', group:'quadríceps'},
  ponte_gluteo:       {name:'Ponte de glúteo', type:'reps', group:'posterior'},
  elevacao_pelvica:   {name:'Elevação pélvica apoiada no banco', type:'reps', group:'posterior'},
  good_morning_elast: {name:'Good morning com elástico', type:'reps', group:'posterior'},
  panturrilha_corpo:  {name:'Panturrilha em pé sem carga', type:'reps', group:'panturrilha', note:'Faça em um degrau para aumentar a amplitude.'},
  panturrilha_halter: {name:'Panturrilha em pé com halteres', type:'reps', group:'panturrilha'},
  abdominal_solo:     {name:'Abdominal no solo', type:'reps', group:'core'},
  bird_dog:           {name:'Bird dog', type:'time', group:'core', note:'Braço e perna opostos, sem deixar o quadril girar. Bom para lombar sensível.'}
};

/* equipamento disponível em cada lugar */
const EQUIP = {
  academia: ['corpo','halter','barra','banco','barra_fixa','polia','maquina','smith','elastico','cardio'],
  simples:  ['corpo','halter','barra','banco','barra_fixa','polia','elastico'],
  casa:     ['corpo','halter','banco','elastico'],
  corpo:    ['corpo']
};

/* junta os exercícios extras ao catálogo principal */
Object.keys(EX_EXTRA).forEach(id => { if(!EX[id]) EX[id] = EX_EXTRA[id]; });

export { EX, META, EQUIP };
