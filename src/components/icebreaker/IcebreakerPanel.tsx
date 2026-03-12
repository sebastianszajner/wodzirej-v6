import { useState, useCallback, useMemo, useEffect } from 'react';
import { useStore } from '../../store';
import { logActivity } from '../../lib/activityLog';

// ── Openness-based question system ──────────────────────────────────────────

type OpennessLevel = 1 | 2 | 3 | 4 | 5;
type Tag = 'team' | 'values' | 'fun' | 'work' | 'energy' | 'creativity' | 'reflection';
type QuestionSource = 'icebreaker' | 'deepener' | 'custom';

interface IcebreakerQuestion {
  text: string;
  level: OpennessLevel;
  tags: Tag[];
}

const LEVEL_META: Record<OpennessLevel, { label: string; color: string; emoji: string; desc: string }> = {
  1: { label: 'Bezpieczne',   color: '#4caf50', emoji: '🟢', desc: 'Fakty, preferencje — zero ryzyka' },
  2: { label: 'Lekkie',       color: '#8bc34a', emoji: '🔵', desc: 'Opinie, wspomnienia, hobby' },
  3: { label: 'Umiarkowane',  color: '#ffc107', emoji: '🟡', desc: 'Historie, doświadczenia' },
  4: { label: 'Osobiste',     color: '#ff9800', emoji: '🟠', desc: 'Wartości, przekonania, emocje' },
  5: { label: 'Głębokie',     color: '#f44336', emoji: '🔴', desc: 'Refleksja, wrażliwość, autentyczność' },
};

const TAG_META: Record<Tag, { label: string; emoji: string }> = {
  team:       { label: 'Zespół',      emoji: '👥' },
  values:     { label: 'Wartości',    emoji: '💎' },
  fun:        { label: 'Zabawne',     emoji: '😄' },
  work:       { label: 'Zawodowe',    emoji: '💼' },
  energy:     { label: 'Energizer',   emoji: '⚡' },
  creativity: { label: 'Kreatywność', emoji: '🎨' },
  reflection: { label: 'Refleksja',   emoji: '🪞' },
};

const ALL_TAGS: Tag[] = ['team', 'values', 'fun', 'work', 'energy', 'creativity', 'reflection'];

// ── Question bank: 130 questions sorted by openness level ───────────────────

const QUESTIONS: IcebreakerQuestion[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 1 — Bezpieczne (fakty, preferencje, zero ryzyka)
  // ═══════════════════════════════════════════════════════════════════════════
  { text: 'Kawa czy herbata?', level: 1, tags: ['fun'] },
  { text: 'Pies czy kot?', level: 1, tags: ['fun'] },
  { text: 'Góry czy morze?', level: 1, tags: ['fun'] },
  { text: 'Rano czy wieczorem — kiedy masz więcej energii?', level: 1, tags: ['fun'] },
  { text: 'Jaki jest Twój ulubiony kolor?', level: 1, tags: ['fun'] },
  { text: 'Z jakiego miasta / regionu pochodzisz?', level: 1, tags: ['team'] },
  { text: 'Ile lat pracujesz w obecnej firmie?', level: 1, tags: ['work'] },
  { text: 'Jaki jest Twój ulubiony sezon roku?', level: 1, tags: ['fun'] },
  { text: 'Jakie jest Twoje ulubione polskie danie?', level: 1, tags: ['fun'] },
  { text: 'Jak się tu dzisiaj dostałeś/aś?', level: 1, tags: ['team'] },
  { text: 'Jedno słowo opisujące Twój dzisiejszy nastrój?', level: 1, tags: ['team'] },
  { text: 'Czym zajmujesz się w pracy w jednym zdaniu?', level: 1, tags: ['work'] },
  { text: 'Papierowa książka czy e-book?', level: 1, tags: ['fun'] },
  { text: 'Pizza czy sushi?', level: 1, tags: ['fun'] },
  { text: 'Film czy serial?', level: 1, tags: ['fun'] },
  { text: 'Jaką aplikację otwierasz na telefonie jako pierwszą rano?', level: 1, tags: ['fun'] },
  { text: 'Praca zdalna czy biuro?', level: 1, tags: ['work'] },
  { text: 'Czego się dzisiaj spodziewasz po tym spotkaniu?', level: 1, tags: ['team'] },
  { text: 'Co jadłeś/aś na śniadanie?', level: 1, tags: ['fun'] },
  { text: 'Wolisz pracować w ciszy czy z muzyką?', level: 1, tags: ['work'] },
  { text: 'Jaki był ostatni film, który oglądałeś/aś?', level: 1, tags: ['fun'] },
  { text: 'Jaka jest Twoja ulubiona pora dnia?', level: 1, tags: ['fun'] },
  { text: 'Ile filiżanek kawy/herbaty pijesz dziennie?', level: 1, tags: ['fun'] },
  { text: 'Kiedy ostatnio byłeś/aś na urlopie — gdzie?', level: 1, tags: ['fun'] },
  { text: 'Gdybyś był/a kolorem, jakim byś był/a?', level: 1, tags: ['fun', 'creativity'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 2 — Lekkie (opinie, wspomnienia, hobby)
  // ═══════════════════════════════════════════════════════════════════════════
  { text: 'Jaki jest Twój ulubiony sposób na spędzanie wolnego czasu?', level: 2, tags: ['fun'] },
  { text: 'Jaki serial lub film polecasz i dlaczego?', level: 2, tags: ['fun'] },
  { text: 'Jakie hobby chciałbyś/chciałabyś kiedyś zacząć?', level: 2, tags: ['fun', 'creativity'] },
  { text: 'Co lubisz robić w deszczowy weekend?', level: 2, tags: ['fun'] },
  { text: 'Jaki jest Twój ukryty talent, o którym mało kto wie?', level: 2, tags: ['fun'] },
  { text: 'Jakie miejsce na świecie chciałbyś/chciałabyś odwiedzić?', level: 2, tags: ['fun'] },
  { text: 'Jaka książka wywarła na Tobie ostatnio wrażenie?', level: 2, tags: ['reflection'] },
  { text: 'Gdybyś mógł/mogła nauczyć się jednej nowej umiejętności z dnia na dzień, co by to było?', level: 2, tags: ['creativity'] },
  { text: 'Jakie trzy rzeczy zabrałbyś/zabrałabyś na bezludną wyspę?', level: 2, tags: ['fun', 'creativity'] },
  { text: 'Opowiedz krótko o swoim najlepszym wspomnieniu z wakacji.', level: 2, tags: ['fun'] },
  { text: 'Jaki jest Twój ulubiony cytat lub motto?', level: 2, tags: ['values'] },
  { text: 'Gdybyś mógł/mogła mieć dowolne zwierzę jako pupila, jakie?', level: 2, tags: ['fun'] },
  { text: 'Jaki jest Twój rekord w czymkolwiek (nawet głupim)?', level: 2, tags: ['fun'] },
  { text: 'Gdyby Twoje życie było filmem, jaki gatunek by to był?', level: 2, tags: ['fun', 'creativity'] },
  { text: 'Jakie było Twoje wymarzone zawody w dzieciństwie?', level: 2, tags: ['fun'] },
  { text: 'Gdybyś mógł/mogła żyć w dowolnej epoce, którą byś wybrał/a?', level: 2, tags: ['creativity'] },
  { text: 'Co ostatnio sprawiło Ci największą radość?', level: 2, tags: ['reflection'] },
  { text: 'Jaki jest najbardziej nieoczekiwany fakt o Tobie?', level: 2, tags: ['fun'] },
  { text: 'Gdybyś mógł/mogła mieć jedną supermoc, co by to było?', level: 2, tags: ['fun', 'creativity'] },
  { text: 'Jaki jest Twój guilty pleasure w muzyce?', level: 2, tags: ['fun'] },
  { text: 'Gdybyś mógł/mogła zaprosić na kolację jedną osobę z historii, kto?', level: 2, tags: ['creativity'] },
  { text: 'Jaki jest najdziwniejszy talent, który posiadasz?', level: 2, tags: ['fun'] },
  { text: 'Gdybyś tworzył/a park rozrywki, jaka byłaby główna atrakcja?', level: 2, tags: ['fun', 'creativity'] },
  { text: 'Jaki jest Twój ulubiony zapach i jakie wspomnienie przywołuje?', level: 2, tags: ['fun', 'reflection'] },
  { text: 'Co jest na szczycie Twojej listy marzeń do spełnienia?', level: 2, tags: ['values'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 3 — Umiarkowane (historie, doświadczenia, opinie)
  // ═══════════════════════════════════════════════════════════════════════════
  { text: 'Opowiedz o momencie, gdy nauczyłeś/aś się czegoś ważnego.', level: 3, tags: ['reflection'] },
  { text: 'Jaka umiejętność zawodowa zmieniła Twoje życie najbardziej?', level: 3, tags: ['work'] },
  { text: 'Jaka jest najlepsza rada, jaką kiedykolwiek dostałeś/aś?', level: 3, tags: ['values'] },
  { text: 'Opowiedz o projekcie, z którego jesteś najbardziej dumny/a.', level: 3, tags: ['work'] },
  { text: 'Co motywuje Cię najbardziej w pracy?', level: 3, tags: ['work', 'values'] },
  { text: 'Opowiedz o podróży, która zmieniła Twoje spojrzenie na świat.', level: 3, tags: ['reflection'] },
  { text: 'Jaki jest Twój najlepszy lifehack produktywnościowy?', level: 3, tags: ['work'] },
  { text: 'Czego nauczył Cię Twój najgorszy szef?', level: 3, tags: ['work', 'reflection'] },
  { text: 'Jaka kompetencja miękka jest Twoim zdaniem niedoceniana?', level: 3, tags: ['work', 'team'] },
  { text: 'Opowiedz o błędzie zawodowym, który okazał się wartościową lekcją.', level: 3, tags: ['work', 'reflection'] },
  { text: 'Gdybyś mógł/mogła dodać jeden przedmiot do programu szkół, jaki?', level: 3, tags: ['values', 'creativity'] },
  { text: 'Co jest ważniejsze — talent czy wytrwałość?', level: 3, tags: ['values'] },
  { text: 'Jak definiujesz dobrego lidera?', level: 3, tags: ['work', 'values'] },
  { text: 'Gdybyś zakładał/a firmę, czym by się zajmowała?', level: 3, tags: ['work', 'creativity'] },
  { text: 'Jaka jest Twoja metoda na efektywne spotkania?', level: 3, tags: ['work', 'team'] },
  { text: 'Gdybyś mógł/mogła zmienić jedną rzecz w swojej branży, co?', level: 3, tags: ['work'] },
  { text: 'Co wyróżnia świetnych profesjonalistów od dobrych?', level: 3, tags: ['work', 'values'] },
  { text: 'Jaki nawyk zawodowy pomógł Ci najbardziej?', level: 3, tags: ['work'] },
  { text: 'Co jest najtrudniejsze w pracy zespołowej?', level: 3, tags: ['team', 'work'] },
  { text: 'Opowiedz o osobie, która miała największy wpływ na Twoje życie.', level: 3, tags: ['reflection', 'values'] },
  { text: 'Gdybyś mógł/mogła cofnąć się w czasie, co powiedziałbyś sobie sprzed 10 lat?', level: 3, tags: ['reflection'] },
  { text: 'Jaki trend w Twojej branży uważasz za najważniejszy?', level: 3, tags: ['work'] },
  { text: 'Co sądzisz o work-life balance — mit czy rzeczywistość?', level: 3, tags: ['work', 'values'] },
  { text: 'Jaki jest Twój ulubiony sposób na naukę nowych rzeczy?', level: 3, tags: ['work', 'creativity'] },
  { text: 'Gdybyś mógł/mogła pracować nad dowolnym projektem, jaki by to był?', level: 3, tags: ['work', 'creativity'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 4 — Osobiste (wartości, przekonania, emocje)
  // ═══════════════════════════════════════════════════════════════════════════
  { text: 'Co jest dla Ciebie najważniejsze w pracy z ludźmi?', level: 4, tags: ['team', 'values'] },
  { text: 'Jaka wartość jest dla Ciebie najważniejsza i dlaczego?', level: 4, tags: ['values'] },
  { text: 'Co daje Ci energię, a co ją zabiera?', level: 4, tags: ['reflection', 'values'] },
  { text: 'Kiedy ostatnio wyszedłeś/aś ze swojej strefy komfortu?', level: 4, tags: ['reflection'] },
  { text: 'Co sprawia, że czujesz się spełniony/a?', level: 4, tags: ['values', 'reflection'] },
  { text: 'Jaki nawyk lub przekonanie chciałbyś/chciałabyś zmienić?', level: 4, tags: ['reflection'] },
  { text: 'Kim chcesz być za 5 lat i co robisz, żeby tam dojść?', level: 4, tags: ['values', 'work'] },
  { text: 'Co trudnego w Twoim życiu okazało się błogosławieństwem?', level: 4, tags: ['reflection', 'values'] },
  { text: 'Jaka porażka nauczyła Cię najwięcej?', level: 4, tags: ['reflection'] },
  { text: 'Czym jest dla Ciebie odwaga?', level: 4, tags: ['values'] },
  { text: 'Jak radzisz sobie z krytyką w pracy?', level: 4, tags: ['work', 'reflection'] },
  { text: 'Co oznacza dla Ciebie sukces — naprawdę?', level: 4, tags: ['values'] },
  { text: 'Co sprawia, że czujesz się naprawdę żywy/a?', level: 4, tags: ['values', 'reflection'] },
  { text: 'Jaki jest Twój sposób na radzenie sobie ze stresem?', level: 4, tags: ['reflection'] },
  { text: 'Co jest ważniejsze — być lubianym czy szanowanym?', level: 4, tags: ['values', 'team'] },
  { text: 'Jaki jest Twój największy życiowy kompromis?', level: 4, tags: ['reflection', 'values'] },
  { text: 'Gdybyś miał/a pewność, że nie możesz ponieść porażki, co byś zrobił/a?', level: 4, tags: ['creativity', 'values'] },
  { text: 'Co chciałbyś/chciałabyś, żeby ludzie mówili o Tobie, gdy Cię nie ma?', level: 4, tags: ['values', 'reflection'] },
  { text: 'Kiedy ostatnio zmieniłeś/aś zdanie o czymś ważnym?', level: 4, tags: ['reflection', 'values'] },
  { text: 'Jaki moment w Twoim życiu uważasz za punkt zwrotny?', level: 4, tags: ['reflection'] },
  { text: 'Gdybyś mógł/mogła przekazać jedną radę przyszłym pokoleniom, jaka by to była?', level: 4, tags: ['values'] },
  { text: 'Co byś powiedział/a komuś, kto czuje się zagubiony w życiu?', level: 4, tags: ['values', 'reflection'] },
  { text: 'Jaka relacja w Twoim życiu zmieniła Cię najbardziej?', level: 4, tags: ['reflection'] },
  { text: 'Czego ostatnio się nauczyłeś/aś o sobie?', level: 4, tags: ['reflection'] },
  { text: 'Co oznacza dla Ciebie autentyczność?', level: 4, tags: ['values'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 5 — Głębokie (refleksja, wrażliwość, autentyczność)
  // ═══════════════════════════════════════════════════════════════════════════
  { text: 'Czego się boisz i jak sobie z tym radzisz?', level: 5, tags: ['reflection'] },
  { text: 'Co byś zmienił/a w swoim życiu, gdyby nie było żadnych ograniczeń?', level: 5, tags: ['values', 'reflection'] },
  { text: 'Co byś zrobił/a inaczej, gdybyś mógł/mogła zacząć od nowa?', level: 5, tags: ['reflection'] },
  { text: 'Jaka lekcja życiowa była dla Ciebie najtrudniejsza?', level: 5, tags: ['reflection'] },
  { text: 'Co poświęciłeś/aś, żeby być tam, gdzie jesteś?', level: 5, tags: ['reflection', 'values'] },
  { text: 'Kiedy ostatnio byłeś/aś naprawdę dumny/a z siebie?', level: 5, tags: ['reflection'] },
  { text: 'Jaki jest najtrudniejszy wybór, którego musiałeś/aś dokonać?', level: 5, tags: ['reflection'] },
  { text: 'Kiedy czujesz się najbardziej sobą?', level: 5, tags: ['reflection', 'values'] },
  { text: 'Gdybyś mógł/mogła zmienić jedną rzecz w świecie, co by to było?', level: 5, tags: ['values'] },
  { text: 'Co zrobiłbyś/zrobiłabyś, gdybyś nie musiał/a zarabiać na życie?', level: 5, tags: ['values', 'creativity'] },
  { text: 'Gdybyś mógł/mogła porozmawiać ze sobą z przeszłości, co byś powiedział/a?', level: 5, tags: ['reflection'] },
  { text: 'Jakie doświadczenie ukształtowało Cię jako człowieka najbardziej?', level: 5, tags: ['reflection'] },
  { text: 'Z czego rezygnujesz, żeby chronić swój spokój?', level: 5, tags: ['reflection', 'values'] },
  { text: 'Co jest Twoją największą siłą — i kiedy staje się słabością?', level: 5, tags: ['reflection'] },
  { text: 'O czym marzyłeś/aś jako dziecko, a z czego zrezygnowałeś/aś?', level: 5, tags: ['reflection'] },
  { text: 'Gdybyś mógł/mogła napisać list do siebie z przyszłości — czego by Ci życzył/a?', level: 5, tags: ['reflection', 'values'] },
  { text: 'Kiedy ostatnio pozwoliłeś/aś sobie na bezbronność?', level: 5, tags: ['reflection'] },
  { text: 'Co by się zmieniło, gdybyś przestał/a się porównywać z innymi?', level: 5, tags: ['reflection', 'values'] },
  { text: 'Jaka prawda o sobie jest najtrudniejsza do zaakceptowania?', level: 5, tags: ['reflection'] },
  { text: 'Co chciałbyś/chciałabyś usłyszeć od kogoś bliskiego?', level: 5, tags: ['reflection', 'values'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // ENERGIZERY (level 1 — fizyczne, zero ryzyka emocjonalnego)
  // ═══════════════════════════════════════════════════════════════════════════
  { text: 'Wstań i pokaż swój najlepszy taneczny ruch!', level: 1, tags: ['energy'] },
  { text: 'Zamień się w posąg — pokaż pozę oddającą Twój nastrój!', level: 1, tags: ['energy'] },
  { text: 'Podaj dalej niewidzialny przedmiot — następna osoba mówi co to!', level: 1, tags: ['energy', 'creativity'] },
  { text: 'Powiedz swoje imię i wykonaj ruch, który je ilustruje!', level: 1, tags: ['energy', 'team'] },
  { text: 'Pokaż gestem, jaki masz teraz poziom energii (1-10)!', level: 1, tags: ['energy', 'team'] },
  { text: 'Wstań i zamień się miejscami z osobą w podobnym kolorze ubrania!', level: 1, tags: ['energy', 'team'] },
  { text: 'Zrób najgłośniejsze „TAK!", jakie potrafisz!', level: 1, tags: ['energy'] },
  { text: 'Pokaż pantomimą swój ulubiony sport!', level: 1, tags: ['energy', 'fun'] },
  { text: 'Wstań i przybij piątkę 3 osobom w pokoju!', level: 1, tags: ['energy', 'team'] },
  { text: 'Głęboki wdech, a na wydechu — jedno słowo opisujące Twój dzień!', level: 1, tags: ['energy', 'team'] },
  { text: 'Wymień 3 rzeczy, które widzisz dookoła — jak najszybciej!', level: 1, tags: ['energy'] },
  { text: 'Pokaż swoją „postawę mocy" (power pose) — trzymaj 10 sekund!', level: 1, tags: ['energy'] },
  { text: 'Zaklaszcz rytm — następna osoba musi go powtórzyć i dodać swój!', level: 1, tags: ['energy', 'team'] },
  { text: 'Wstań i dotknij czegoś niebieskiego w pokoju!', level: 1, tags: ['energy', 'fun'] },
  { text: 'Powiedz komplementy 2 osobom siedzącym najbliżej!', level: 1, tags: ['energy', 'team'] },
  { text: 'Zagraj w „kamień, papier, nożyce" z osobą obok — best of 3!', level: 1, tags: ['energy', 'fun'] },
];

// ── Pogłębiarka: 95 deep integration questions ─────────────────────────────

const DEEPENER_QUESTIONS: IcebreakerQuestion[] = [
  // LEVEL 1 — Bezpieczne (fakty, preferencje)
  { text: 'Jaką jedną potrawę mógłbyś/mogłabyś jeść do końca swoich dni, a innych potraw nigdy więcej?', level: 1, tags: ['fun'] },
  { text: 'Do jakich trzech produktów spożywczych masz tak mocne słabości, że ich w domu lepiej nie mieć?', level: 1, tags: ['fun'] },
  { text: 'Jakie są Twoje ulubione marki, bez których nie wyobrażasz sobie życia?', level: 1, tags: ['fun'] },
  { text: 'Jakie są Twoje ulubione zapachy? (np. cytrusowe, korzenne, kwiatowe, leśne itd.)', level: 1, tags: ['fun'] },
  { text: 'Twoje słodyczowe guilty pleasures, czyli czym słodkim lubisz sobie pofolgować najbardziej?', level: 1, tags: ['fun'] },
  { text: 'Jakie są Twoje ulubione aplikacje na smartfon?', level: 1, tags: ['fun'] },
  { text: 'Jakie kanały na YouTube subskrybujesz?', level: 1, tags: ['fun'] },
  { text: 'Jakie są Twoje ulubione strony internetowe (oprócz social mediów) i dlaczego je lubisz?', level: 1, tags: ['fun'] },
  { text: 'Jaka potrawa z dzieciństwa wspominasz najczulej (którą robiła Twoja mama / babcia / ktoś bliski)?', level: 1, tags: ['fun'] },
  { text: 'Na jaki odgłos się wzdragasz (np. pisk kredy po tablicy, sztućce po talerzu, drapanie po kartonie)?', level: 1, tags: ['fun'] },
  { text: 'Jaką potrawę udało Ci się kiedyś spektakularnie zepsuć?', level: 1, tags: ['fun'] },
  { text: 'Jakie słone albo słodkie przekąski wciągają Cię bardziej niż inne?', level: 1, tags: ['fun'] },
  { text: 'Jaki nieoczywisty zapach mógłbyś/mogłabyś wąchać bez końca (np. benzyna, masło, świeżo wydrukowana książka)?', level: 1, tags: ['fun'] },
  { text: 'Z jakich 3 aplikacji na Twoim smartfonie najtrudniej byłoby Ci zrezygnować?', level: 1, tags: ['fun'] },
  { text: 'Jakie smaki kojarzą Ci się z beztroską?', level: 1, tags: ['fun'] },
  { text: 'Jaki masz stosunek do porządków i utrzymywania czystości?', level: 1, tags: ['fun'] },
  { text: 'Co najlepszego jadłaś/eś w ciągu ostatniego kwartału?', level: 1, tags: ['fun'] },
  { text: 'Co umiesz zaśpiewać? W swoim języku ojczystym i w językach obcych?', level: 1, tags: ['fun', 'energy'] },
  { text: 'W otoczeniu jakich kolorów czujesz się najlepiej?', level: 1, tags: ['fun'] },
  { text: 'Jak najbardziej lubisz odpoczywać?', level: 1, tags: ['fun'] },
  { text: 'Jakich podcastów słuchasz i dlaczego?', level: 1, tags: ['fun'] },
  { text: 'Jaki zapach lub widok powoduje w Tobie automatyczne mdłości, a jaki ku zdziwieniu innych wcale nie?', level: 1, tags: ['fun'] },
  { text: 'Jaka potrawa (lub składnik) z dzieciństwa wywoływała w Tobie odrazę, a obecnie się tym zajadasz?', level: 1, tags: ['fun'] },

  // LEVEL 2 — Lekkie (opinie, wspomnienia, hobby)
  { text: 'Wymień swoje „celebrity crush", czyli celebrytów lub celebrytki, w których się podkochujesz.', level: 2, tags: ['fun'] },
  { text: 'Jaka moda czy trend z ostatnich lat w ogóle Cię nie kręci?', level: 2, tags: ['fun'] },
  { text: 'Jaką ciekawą osobę spotkałaś/eś kiedyś w pociągu?', level: 2, tags: ['fun'] },
  { text: 'Gdybyś znalazł/a na ulicy 500 zł, co byś z nim zrobił/a?', level: 2, tags: ['fun', 'creativity'] },
  { text: 'Do czego kompletnie nie masz cierpliwości?', level: 2, tags: ['reflection'] },
  { text: 'Jaki obraz albo obrazy mógłbyś/mogłabyś mieć w domu?', level: 2, tags: ['fun', 'creativity'] },
  { text: 'Z jaką bajkową postacią mógłbyś/mogłabyś się utożsamić i dlaczego?', level: 2, tags: ['fun', 'creativity'] },
  { text: 'Jakie nawyki z dzieciństwa czy z okresu dojrzewania masz do dziś?', level: 2, tags: ['reflection'] },
  { text: 'Kiedy, w jakiej epoce, wieku lub kulturze mógłbyś się urodzić, gdybyś miał/a na to wpływ?', level: 2, tags: ['creativity'] },
  { text: 'W jakim innym mieście (bez zmiany kraju zamieszkania) mógłbyś/mogłabyś mieszkać?', level: 2, tags: ['fun'] },
  { text: 'Co powinno być według Ciebie tematem murali w mieście?', level: 2, tags: ['creativity'] },
  { text: 'Ile chciał(a)byś mieć lat, jeśli miał(a)byś na zawsze pozostać w jednym wieku?', level: 2, tags: ['fun'] },
  { text: 'Bez jakiego wynalazku z ostatnich 30 lat nie wyobrażasz sobie życia?', level: 2, tags: ['fun'] },
  { text: 'W jakim kraju mógłbyś/mogłabyś mieszkać (albo przynajmniej przez jakiś czas)?', level: 2, tags: ['fun'] },
  { text: 'Jakie wspomnienie z dzieciństwa lubisz najbardziej?', level: 2, tags: ['reflection'] },
  { text: 'Opisz sytuację, w której miałeś/miałaś mega pecha.', level: 2, tags: ['fun'] },
  { text: 'Co mogłoby być rewolucyjnym wynalazkiem, o którym jeszcze nie słyszałeś/aś?', level: 2, tags: ['creativity'] },
  { text: 'Co kreatywnego ostatnio zrobiłaś/eś?', level: 2, tags: ['creativity'] },
  { text: 'Jakim był(a)byś zwierzęciem i dlaczego?', level: 2, tags: ['fun', 'creativity'] },
  { text: 'Co mogą o Tobie powiedzieć Twoje aplikacje na pulpicie smartfona?', level: 2, tags: ['fun'] },
  { text: 'Gdybyś był/a rośliną, jak byś scharakteryzował/a siebie?', level: 2, tags: ['fun', 'creativity'] },
  { text: 'Jakie są Twoje ulubione powiedzonka lub przysłowia, którymi kierujesz się w życiu?', level: 2, tags: ['values'] },
  { text: 'Jaką historię (z życia swojego lub bliskich) lubisz opowiadać?', level: 2, tags: ['fun'] },
  { text: 'Gdybyś mógł/mogła zrobić sobie Dzień Wolny Tylko Dla Siebie, jakie punkty programu by się znalazły?', level: 2, tags: ['fun'] },
  { text: 'Jak lubisz sobie dogadzać i się rozpieszczać?', level: 2, tags: ['fun'] },
  { text: 'Co pamiętasz ze studiów? Co zrobiło na Tobie naprawdę duże wrażenie?', level: 2, tags: ['reflection'] },
  { text: 'Jakie miejsca na świecie chciałabyś/chciałbyś zobaczyć i dlaczego?', level: 2, tags: ['fun'] },
  { text: 'Jakich słów nadużywasz, a które mogą oddawać Twój stosunek do życia i świata?', level: 2, tags: ['reflection'] },
  { text: 'Jaki konkretny zapach (naturalny lub syntetyczny) kojarzy Ci się z konkretną sytuacją w życiu?', level: 2, tags: ['reflection'] },
  { text: 'Jaka informacja mogłaby Cię zaskoczyć na tyle, że zabrakłoby Ci słów?', level: 2, tags: ['fun'] },
  { text: 'Gdybyś miał/a możliwość wyboru ostatniego posiłku w życiu, co by to było? Podaj szczegóły.', level: 2, tags: ['fun', 'creativity'] },
  { text: 'Wymień książki lub inne przejawy kultury, które mocno wpłynęły na Twoje życie.', level: 2, tags: ['values', 'reflection'] },
  { text: 'Gdybyś wiedział/a, że trafisz na bezludną wyspę na rok, jakie 5 rzeczy zabrał(a)byś ze sobą?', level: 2, tags: ['fun', 'creativity'] },
  { text: 'O czym byłaby napisana przez Ciebie książka?', level: 2, tags: ['creativity'] },
  { text: 'Jaki tekst zdobiłby wycieraczkę przed drzwiami do Twojego domu?', level: 2, tags: ['fun', 'creativity'] },
  { text: 'Czego żałujesz, że już nie ma, co było za Twoich czasów nastoletnich?', level: 2, tags: ['reflection'] },
  { text: 'Co musiałoby się stać, żebyś ścięła włosy na 5 mm albo zapuścił je do ramion?', level: 2, tags: ['fun'] },
  { text: 'Czy jest jakieś miejsce, do którego masz już zakaz wstępu? Dlaczego?', level: 2, tags: ['fun'] },

  // LEVEL 3 — Umiarkowane (historie, doświadczenia, opinie)
  { text: 'Jakiego swojego życiowego projektu nie możesz się doczekać?', level: 3, tags: ['values'] },
  { text: 'Jakie są Twoje życiowe odkrycia tego roku? (nauki o sobie, filmach, muzyce, książkach, cytatach)', level: 3, tags: ['reflection'] },
  { text: 'Jakiego rodzaju rozmowy Cię męczą?', level: 3, tags: ['reflection'] },
  { text: 'Kim są Twoi przyjaciele? Za co ich cenisz?', level: 3, tags: ['values', 'team'] },
  { text: 'Co Cię napędza do działania?', level: 3, tags: ['values'] },
  { text: 'Co najczęściej odkładasz na później i dlaczego?', level: 3, tags: ['reflection'] },
  { text: 'Co najbardziej marnuje Twój czas, chociaż od tego zaczynasz dzień albo wieczór?', level: 3, tags: ['reflection'] },
  { text: 'W jaki sposób obniżasz sobie (bez używek) nastrój lub energię, choć wiesz, że Ci to nie służy?', level: 3, tags: ['reflection'] },
  { text: 'Jakich rzeczy jesteś ciekawy / ciekawa?', level: 3, tags: ['reflection', 'creativity'] },
  { text: 'Wybierz sobie, że dostajesz milion dolarów. Na co przeznaczysz tę kwotę?', level: 3, tags: ['fun', 'values'] },
  { text: 'Jakie rzeczy znajdują się na szczycie Twojej listy rzeczy do zrobienia przed śmiercią?', level: 3, tags: ['values'] },
  { text: 'Co (z rzeczy raczej nieoczywistych) uznał(a)byś za najgorszą dla Ciebie torturę?', level: 3, tags: ['fun'] },
  { text: '„Ostatnią rzeczą, jaką chciał(a)bym robić, jest…" – wymień 3 najmniej preferowane zawody.', level: 3, tags: ['fun'] },
  { text: 'Jakie ważne / znaczące momenty w tym roku były dla Ciebie istotne?', level: 3, tags: ['reflection'] },
  { text: 'Na czym ostatnio oszczędzasz bez sensu i czy to Ci służy, czy przeszkadza?', level: 3, tags: ['reflection'] },
  { text: 'Który megatrend najbardziej Cię ekscytuje, a który niepokoi? (digitalizacja, smart city, klimat itd.)', level: 3, tags: ['values'] },
  { text: 'Jakie ważne decyzje w swoim życiu oparłaś/eś na intuicji?', level: 3, tags: ['reflection'] },
  { text: 'Gdybyś miał/a jedno życzenie do „złotej rybki", co by to było?', level: 3, tags: ['values', 'creativity'] },
  { text: 'Ze zdaniem jakiej osoby powyżej 60 lat się liczysz?', level: 3, tags: ['values'] },
  { text: 'Co byś zrobił/a za 10 000 zł? Co za 50 000? A czego nie zrobił(a)byś za żadne pieniądze?', level: 3, tags: ['fun', 'values'] },
  { text: 'Jaka wiedza na Twój własny temat ostatnio Cię zaskoczyła?', level: 3, tags: ['reflection'] },
  { text: 'Jakie pozytywne zmiany (oprócz „pokoju na świecie") chciał(a)byś, aby nastąpiły globalnie?', level: 3, tags: ['values'] },
  { text: 'Wymień 3 słowa, którymi mógłbyś/mogłabyś siebie opisać.', level: 3, tags: ['reflection'] },
  { text: 'Co robisz, kiedy nikt nie patrzy?', level: 3, tags: ['fun', 'reflection'] },
  { text: 'Jaka byłaby Twoja recepta na szczęście?', level: 3, tags: ['values'] },

  // LEVEL 4 — Osobiste (wartości, przekonania, emocje)
  { text: 'Gdybyś się dowiedział/a, że za rok umrzesz, co byś zmienił/a w swoim życiu? Dlaczego?', level: 4, tags: ['values', 'reflection'] },
  { text: 'Jaka była najbardziej bolesna fizycznie rzecz, która przydarzyła się Twojemu ciału?', level: 4, tags: ['reflection'] },
  { text: 'Za co jesteś najbardziej wdzięczny/a?', level: 4, tags: ['values'] },
  { text: 'Jakie rzeczy nadają Twojemu życiu sens?', level: 4, tags: ['values'] },
  { text: 'Czego byś nigdy nie zrobił/a ze swoim ciałem?', level: 4, tags: ['values'] },
  { text: 'Co mogłabyś / mógłbyś robić w życiu, gdybyś nie musiał(a) zarabiać pieniędzy?', level: 4, tags: ['values', 'creativity'] },
  { text: 'Jakiego rodzaju relacji najbardziej potrzebujesz?', level: 4, tags: ['values', 'reflection'] },
  { text: 'Gdybyś był/a w stanie cofnąć czas, jaką sytuację byś zmienił(a), a czego nie?', level: 4, tags: ['reflection'] },
  { text: 'Jakie wartości są w Twoim życiu najważniejsze? (wymień 3–6)', level: 4, tags: ['values'] },
];

// ── Custom questions persistence ─────────────────────────────────────────────

const CUSTOM_Q_KEY = 'wodzirej-custom-questions';

function loadCustomQuestions(): IcebreakerQuestion[] {
  try {
    const raw = localStorage.getItem(CUSTOM_Q_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveCustomQuestions(questions: IcebreakerQuestion[]) {
  localStorage.setItem(CUSTOM_Q_KEY, JSON.stringify(questions));
}

// ── Component ───────────────────────────────────────────────────────────────

export function IcebreakerPanel() {
  const participants = useStore((s) => s.participants);

  const [source, setSource] = useState<QuestionSource>('icebreaker');
  const [maxLevel, setMaxLevel] = useState<OpennessLevel>(3);
  const [activeTags, setActiveTags] = useState<Set<Tag>>(new Set(ALL_TAGS));
  const [shownIds, setShownIds] = useState<Set<number>>(new Set());
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [assignedParticipant, setAssignedParticipant] = useState<string | null>(null);
  const [showParticipant, setShowParticipant] = useState(participants.length > 0);
  const [fullscreen, setFullscreen] = useState(false);

  // Custom questions state
  const [customQuestions, setCustomQuestions] = useState<IcebreakerQuestion[]>(loadCustomQuestions);
  const [customExpanded, setCustomExpanded] = useState(false);
  const [newQText, setNewQText] = useState('');
  const [newQLevel, setNewQLevel] = useState<OpennessLevel>(2);
  const [newQTags, setNewQTags] = useState<Set<Tag>>(new Set(['team']));

  useEffect(() => {
    saveCustomQuestions(customQuestions);
  }, [customQuestions]);

  const addCustomQuestion = () => {
    const text = newQText.trim();
    if (!text) return;
    const q: IcebreakerQuestion = { text, level: newQLevel, tags: [...newQTags] };
    setCustomQuestions((prev) => [...prev, q]);
    setNewQText('');
  };

  const removeCustomQuestion = (index: number) => {
    setCustomQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleNewQTag = (tag: Tag) => {
    setNewQTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        if (next.size > 1) next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const questionBank = source === 'custom'
    ? customQuestions
    : source === 'icebreaker' ? QUESTIONS : DEEPENER_QUESTIONS;

  const switchSource = (s: QuestionSource) => {
    setSource(s);
    setShownIds(new Set());
    setCurrentIdx(null);
    setAssignedParticipant(null);
  };

  // Build available pool
  const availablePool = useMemo(() => {
    return questionBank
      .map((q, i) => ({ ...q, idx: i }))
      .filter((q) => q.level <= maxLevel)
      .filter((q) => q.tags.some((t) => activeTags.has(t)))
      .filter((q) => !shownIds.has(q.idx));
  }, [questionBank, maxLevel, activeTags, shownIds]);

  const totalFiltered = useMemo(() => {
    return questionBank
      .filter((q) => q.level <= maxLevel)
      .filter((q) => q.tags.some((t) => activeTags.has(t)))
      .length;
  }, [questionBank, maxLevel, activeTags]);

  const currentQuestion = currentIdx !== null ? questionBank[currentIdx] : null;

  const toggleTag = (tag: Tag) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        if (next.size > 1) next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const pickRandom = useCallback(() => {
    if (availablePool.length === 0) return;
    const item = availablePool[Math.floor(Math.random() * availablePool.length)];
    setCurrentIdx(item.idx);
    setShownIds((prev) => new Set([...prev, item.idx]));

    if (showParticipant && participants.length > 0) {
      const p = participants[Math.floor(Math.random() * participants.length)];
      setAssignedParticipant(p.text);
      logActivity({ participantId: p.id, panel: 'icebreaker', action: 'assigned_question', data: { question: item.text, level: item.level } });
    } else {
      setAssignedParticipant(null);
    }
  }, [availablePool, showParticipant, participants]);

  const resetHistory = () => {
    setShownIds(new Set());
    setCurrentIdx(null);
    setAssignedParticipant(null);
  };

  const remainingCount = availablePool.length;
  const levelColor = LEVEL_META[maxLevel].color;

  // ── Fullscreen view ──

  if (fullscreen && currentQuestion) {
    return (
      <div className="panel icebreaker-panel" style={{ overflow: 'auto', padding: '16px', flex: 1 }}>
        <style>{ICE_STYLES}</style>
        <div className="icebreaker-fullscreen-overlay">
          <button className="btn icebreaker-exit-fs" onClick={() => setFullscreen(false)} title="Zamknij">
            &times;
          </button>

          <div className="icebreaker-fs-level-badge" style={{ background: levelColor }}>
            {LEVEL_META[currentQuestion.level].emoji} Poziom {currentQuestion.level} — {LEVEL_META[currentQuestion.level].label}
          </div>

          {assignedParticipant && (
            <div className="icebreaker-fs-participant">
              Pytanie dla: <strong>{assignedParticipant}</strong>
            </div>
          )}

          <div className="icebreaker-fs-question">{currentQuestion.text}</div>

          <div className="icebreaker-fs-controls">
            <button className="btn primary" onClick={pickRandom} disabled={remainingCount === 0}>
              {remainingCount > 0 ? 'Następne' : 'Brak pytań'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal view ──

  return (
    <div className="panel icebreaker-panel" style={{ overflow: 'auto', padding: '16px', flex: 1 }}>
      <style>{ICE_STYLES}</style>

      {/* Source toggle */}
      <div className="ice-source-toggle">
        <button
          className={`btn ice-source-btn${source === 'icebreaker' ? ' active' : ''}`}
          onClick={() => switchSource('icebreaker')}
        >
          🧊 Lodołamacz
        </button>
        <button
          className={`btn ice-source-btn${source === 'deepener' ? ' active' : ''}`}
          onClick={() => switchSource('deepener')}
        >
          🔍 Pogłębiarka
        </button>
        <button
          className={`btn ice-source-btn${source === 'custom' ? ' active' : ''}`}
          onClick={() => switchSource('custom')}
        >
          ✏️ Własne{customQuestions.length > 0 ? ` (${customQuestions.length})` : ''}
        </button>
      </div>

      {/* Custom questions management */}
      <div className="ice-custom-section">
        <button
          className="btn ice-custom-toggle"
          onClick={() => setCustomExpanded((v) => !v)}
        >
          {customExpanded ? '▾' : '▸'} Własne pytania ({customQuestions.length})
        </button>
        {customExpanded && (
          <div className="ice-custom-body">
            <div className="ice-custom-form">
              <input
                type="text"
                className="ice-custom-input"
                placeholder="Treść pytania..."
                value={newQText}
                onChange={(e) => setNewQText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomQuestion()}
              />
              <div className="ice-custom-row">
                <label className="ice-custom-label">Poziom:</label>
                <select
                  className="ice-custom-select"
                  value={newQLevel}
                  onChange={(e) => setNewQLevel(Number(e.target.value) as OpennessLevel)}
                >
                  {([1, 2, 3, 4, 5] as OpennessLevel[]).map((lv) => (
                    <option key={lv} value={lv}>
                      {lv} — {LEVEL_META[lv].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ice-custom-row">
                <label className="ice-custom-label">Tagi:</label>
                <div className="ice-custom-tags">
                  {ALL_TAGS.map((tag) => (
                    <label key={tag} className="ice-custom-tag-check">
                      <input
                        type="checkbox"
                        checked={newQTags.has(tag)}
                        onChange={() => toggleNewQTag(tag)}
                      />
                      <span>{TAG_META[tag].emoji} {TAG_META[tag].label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                className="btn primary ice-custom-add-btn"
                onClick={addCustomQuestion}
                disabled={!newQText.trim()}
              >
                Dodaj
              </button>
            </div>
            {customQuestions.length > 0 && (
              <div className="ice-custom-list">
                {customQuestions.map((q, i) => (
                  <div key={i} className="ice-custom-item">
                    <div className="ice-custom-item-info">
                      <span
                        className="ice-custom-item-level"
                        style={{ background: LEVEL_META[q.level].color }}
                      >
                        {q.level}
                      </span>
                      <span className="ice-custom-item-text">{q.text}</span>
                    </div>
                    <button
                      className="btn ice-custom-delete"
                      onClick={() => removeCustomQuestion(i)}
                      title="Usuń"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Openness level slider */}
      <div className="ice-openness-section">
        <div className="ice-openness-header">
          <span className="ice-openness-title">Poziom otwartości</span>
          <span className="ice-openness-value" style={{ color: levelColor }}>
            {LEVEL_META[maxLevel].emoji} {maxLevel} — {LEVEL_META[maxLevel].label}
          </span>
        </div>
        <div className="ice-openness-desc">{LEVEL_META[maxLevel].desc}</div>
        <div className="ice-slider-row">
          <span className="ice-slider-label">🟢 1</span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={maxLevel}
            onChange={(e) => setMaxLevel(Number(e.target.value) as OpennessLevel)}
            className="ice-slider"
            style={{
              '--slider-color': levelColor,
              '--slider-pct': `${((maxLevel - 1) / 4) * 100}%`,
            } as React.CSSProperties}
          />
          <span className="ice-slider-label">🔴 5</span>
        </div>
        <div className="ice-level-dots">
          {([1, 2, 3, 4, 5] as OpennessLevel[]).map((lv) => (
            <button
              key={lv}
              className={`ice-level-dot${maxLevel >= lv ? ' active' : ''}`}
              style={{ background: maxLevel >= lv ? LEVEL_META[lv].color : 'var(--input-bg)' }}
              onClick={() => setMaxLevel(lv)}
              title={LEVEL_META[lv].label}
            />
          ))}
        </div>
      </div>

      {/* Tag filter pills */}
      <div className="icebreaker-section">
        <div className="icebreaker-section-title">Tematy</div>
        <div className="icebreaker-pills">
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              className={`btn icebreaker-pill${activeTags.has(tag) ? ' active' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {TAG_META[tag].emoji} {TAG_META[tag].label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="icebreaker-stats">
        <span>
          Pozostało: <strong>{remainingCount}</strong> / {totalFiltered}
        </span>
        {shownIds.size > 0 && (
          <button className="btn icebreaker-reset-btn" onClick={resetHistory}>
            Resetuj historię
          </button>
        )}
      </div>

      {/* Participant toggle */}
      {participants.length > 0 && (
        <div className="icebreaker-participant-toggle">
          <label className="icebreaker-toggle-label">
            <input type="checkbox" checked={showParticipant} onChange={(e) => setShowParticipant(e.target.checked)} />
            <span>Losuj uczestnika do pytania</span>
          </label>
        </div>
      )}

      {/* Question display */}
      <div className="icebreaker-display">
        {currentQuestion ? (
          <>
            <div
              className="ice-level-badge"
              style={{ background: LEVEL_META[currentQuestion.level].color }}
            >
              {LEVEL_META[currentQuestion.level].emoji} Poziom {currentQuestion.level}
            </div>

            {assignedParticipant && (
              <div className="icebreaker-assigned">
                Pytanie dla: <strong>{assignedParticipant}</strong>
              </div>
            )}

            <div className="icebreaker-question">{currentQuestion.text}</div>

            <div className="ice-question-tags">
              {currentQuestion.tags.map((t) => (
                <span key={t} className="ice-tag-chip">
                  {TAG_META[t].emoji} {TAG_META[t].label}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="icebreaker-empty">
            <div className="icebreaker-empty-icon">🧊</div>
            <p>Naciśnij „Losuj!" żeby wylosować pytanie</p>
            <p style={{ fontSize: '12px', color: 'var(--txt-muted)', marginTop: '4px' }}>
              Podnoś poziom otwartości stopniowo w trakcie warsztatu
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="icebreaker-controls">
        <button className="btn primary icebreaker-draw-btn" onClick={pickRandom} disabled={remainingCount === 0}>
          {currentQuestion ? 'Następne' : 'Losuj!'}
        </button>
        {currentQuestion && (
          <button className="btn icebreaker-fs-btn" onClick={() => setFullscreen(true)} title="Pełny ekran">
            ⛶
          </button>
        )}
      </div>

      {shownIds.size > 0 && (
        <div className="icebreaker-shown-info">
          Pokazano {shownIds.size} pytań w tej sesji
        </div>
      )}
    </div>
  );
}

// ── Scoped styles ────────────────────────────────────────────────────────────

const ICE_STYLES = `
/* Source toggle */
.ice-source-toggle {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.ice-source-btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  background: var(--input-bg);
  color: var(--txt-muted);
  transition: all 0.2s;
  border: 2px solid transparent;
}
.ice-source-btn.active {
  background: rgba(233, 30, 99, 0.15);
  color: var(--accent);
  border-color: var(--accent);
}
.ice-source-btn:hover:not(.active) {
  background: rgba(255,255,255,0.08);
}

/* Custom questions section */
.ice-custom-section {
  margin-bottom: 12px;
}
.ice-custom-toggle {
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  background: var(--input-bg);
  color: var(--txt-muted);
}
.ice-custom-body {
  background: var(--panel-bg);
  border-radius: var(--radius);
  padding: 12px;
  margin-top: 6px;
}
.ice-custom-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}
.ice-custom-input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  background: var(--input-bg);
  color: var(--txt-main);
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}
.ice-custom-input:focus {
  border-color: var(--accent);
}
.ice-custom-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.ice-custom-label {
  font-size: 12px;
  color: var(--txt-muted);
  white-space: nowrap;
  padding-top: 4px;
  min-width: 50px;
}
.ice-custom-select {
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--txt-main);
  border: 1px solid rgba(255,255,255,0.1);
  font-size: 12px;
  outline: none;
}
.ice-custom-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
}
.ice-custom-tag-check {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--txt-muted);
  cursor: pointer;
}
.ice-custom-tag-check input {
  accent-color: var(--accent);
  width: 14px;
  height: 14px;
}
.ice-custom-add-btn {
  align-self: flex-start;
  padding: 6px 20px !important;
  font-size: 13px !important;
  border-radius: 8px !important;
}
.ice-custom-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ice-custom-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
}
.ice-custom-item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.ice-custom-item-level {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.ice-custom-item-text {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ice-custom-delete {
  flex-shrink: 0;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 6px;
  background: rgba(244,67,54,0.15);
  color: #f44336;
}

/* Openness slider section */
.ice-openness-section {
  background: var(--panel-bg);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 12px;
}
.ice-openness-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.ice-openness-title {
  font-weight: 700;
  font-size: 14px;
}
.ice-openness-value {
  font-weight: 700;
  font-size: 14px;
}
.ice-openness-desc {
  font-size: 12px;
  color: var(--txt-muted);
  margin-bottom: 10px;
}
.ice-slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ice-slider-label {
  font-size: 12px;
  flex-shrink: 0;
}
.ice-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(
    to right,
    var(--slider-color) var(--slider-pct),
    var(--input-bg) var(--slider-pct)
  );
  outline: none;
  cursor: pointer;
}
.ice-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--slider-color);
  border: 3px solid var(--bg);
  box-shadow: 0 0 6px rgba(0,0,0,0.4);
  cursor: pointer;
  transition: transform 0.15s;
}
.ice-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}
.ice-slider::-moz-range-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--slider-color);
  border: 3px solid var(--bg);
  cursor: pointer;
}
.ice-level-dots {
  display: flex;
  justify-content: space-between;
  padding: 8px 26px 0;
}
.ice-level-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.15);
  cursor: pointer;
  transition: all 0.2s;
}
.ice-level-dot.active {
  border-color: transparent;
  box-shadow: 0 0 8px rgba(255,255,255,0.2);
}
.ice-level-dot:hover {
  transform: scale(1.3);
}

/* Level badge on question */
.ice-level-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

/* Tags on question */
.ice-question-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
  justify-content: center;
}
.ice-tag-chip {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(255,255,255,0.06);
  color: var(--txt-muted);
}

/* Fullscreen level badge */
.icebreaker-fs-level-badge {
  padding: 8px 20px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16px;
}

/* ── Existing styles (carried over) ── */

.icebreaker-section { margin-bottom: 12px; }
.icebreaker-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--txt-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.icebreaker-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.icebreaker-pill {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  background: var(--input-bg);
  color: var(--txt-muted);
  transition: all 0.15s;
  border: 1px solid transparent;
}
.icebreaker-pill.active {
  background: rgba(233, 30, 99, 0.15);
  color: var(--accent);
  border-color: var(--accent);
}
.icebreaker-pill:hover {
  background: rgba(255,255,255,0.08);
}
.icebreaker-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--txt-muted);
  margin-bottom: 10px;
}
.icebreaker-reset-btn {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--txt-muted);
}
.icebreaker-participant-toggle {
  margin-bottom: 12px;
}
.icebreaker-toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
  color: var(--txt-muted);
}
.icebreaker-toggle-label input[type="checkbox"] {
  accent-color: var(--accent);
}
.icebreaker-display {
  background: var(--panel-bg);
  border-radius: var(--radius);
  padding: 32px 24px;
  text-align: center;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 14px;
}
.icebreaker-assigned {
  font-size: 15px;
  color: var(--accent);
  margin-bottom: 8px;
}
.icebreaker-question {
  font-weight: 700;
  line-height: 1.4;
  max-width: 700px;
  animation: ice-pop 0.3s ease-out;
}
@keyframes ice-pop {
  0% { opacity: 0; transform: scale(0.9) translateY(8px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.icebreaker-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--txt-muted);
}
.icebreaker-empty-icon { font-size: 48px; }
.icebreaker-controls {
  display: flex;
  gap: 8px;
  justify-content: center;
}
.icebreaker-draw-btn {
  padding: 12px 36px !important;
  font-size: 16px !important;
  border-radius: 12px !important;
}
.icebreaker-fs-btn {
  padding: 12px 16px;
  background: var(--input-bg);
  border-radius: 12px;
  font-size: 18px;
  color: var(--txt-muted);
}
.icebreaker-shown-info {
  text-align: center;
  font-size: 12px;
  color: var(--txt-muted);
  margin-top: 10px;
}

/* Fullscreen overlay */
.icebreaker-fullscreen-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
}
.icebreaker-exit-fs {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 28px;
  background: rgba(255,255,255,0.1);
  color: var(--txt-main);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icebreaker-fs-participant {
  font-size: 20px;
  color: var(--accent);
  margin-bottom: 12px;
}
.icebreaker-fs-question {
  font-size: 36px;
  font-weight: 700;
  text-align: center;
  max-width: 800px;
  line-height: 1.3;
  animation: ice-pop 0.3s ease-out;
}
.icebreaker-fs-controls {
  margin-top: 32px;
}
`;
