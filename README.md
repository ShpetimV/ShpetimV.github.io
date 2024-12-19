# <img src="public/favicon.png" alt="favicon" width="32" height="32"> Connect Four - WBE Miniprojekt HS2024
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
## Teammitglieder
- Shpetim Veseli
- Christian köhler

## Links
- Link zu dem [GitHub Repository](https://github.com/ShpetimV/ShpetimV.github.io)
- Link zu dem [GitHub Pages](https://shpetimv.github.io/public/connect4.html)

## Installation Lokal
Der Express Server funktioniert nur auf einem lokalen Server. Um das Spiel lokal zu starten, müssen folgende Schritte durchgeführt werden:
1. Repository klonen

```bash
  git clone git@github.com:ShpetimV/ShpetimV.github.io.git
```
2. In das Verzeichnis wechseln

```bash
  cd ShpetimV.github.io
```
3. Dependencies installieren

```bash
  npm install
```
4. Server starten

```bash
  node index.js
```

5. Im Browser öffnen

```bash
  http://localhost:3000/connect4.html
```


## Beschreibung
Das Spiel Connect Four ist ein Spiel für zwei Spieler, bei dem die Spieler abwechselnd Spielsteine in ein vertikales Spielfeld fallen lassen. Der Spieler, der als erster vier Steine in einer Reihe, Spalte oder Diagonale hat, gewinnt das Spiel.

## Funktionsübersicht
- Neues Spiel starten und Spielbrett zurücksetzen
- Spielzug durchführen
- Spielstand überprüfen
- Gewinner ermitteln
- Spielzug rückgängig machen
- Anzeige welcher Spieler am Zug ist
- Anzeige des Gewinners
- Anzeige bei Unentschieden
- Spielstand laden und speichern in LocalStorage
- Spielstand laden und speichern auf den Server

## Diverses
Der JavaScript Code wurde in ein model und view aufgeteilt. Das model beinhaltet die Spiellogik und das view die Darstellung des Spiels.



## Screenshots
![img.png](img.png)