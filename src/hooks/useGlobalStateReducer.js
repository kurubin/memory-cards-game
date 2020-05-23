import { useReducer, useEffect } from "react";
import useRandomColors from "./useRandomColors";

const NUMBER_OF_CARDS = 16;
// Color palette generated here:
// https://coolors.co/063f50-724e56-db504a-df8328-e3b505-9b9f4b-56a3a6-e6e1c5-ada375
const POSSIBLE_COLORS = [
  "#063F50",
  "#724E56",
  "#DB504A",
  "#DF8328",
  "#E3B505",
  "#9B9F4B",
  "#56A3A6",
  "#E6E1C5",
  "#ADA375",
];

function reducer(state, action) {
  switch (action.type) {
    case "FLIP_CARD": {
      if (!state.isInteractive) return state;

      let wasVisible = state.board[action.idx].visible;
      let newBoard = [...state.board];
      let newCount = !wasVisible ? state.count + 1 : state.count;
      let newFlippedCards = [...state.flippedCards, action.idx];

      newBoard[action.idx] = {
        ...newBoard[action.idx],
        visible: !wasVisible,
      };

      return {
        ...state,
        board: newBoard,
        count: newCount,
        flippedCards: newFlippedCards,
      };
    }
    case "DISABLE_BOARD": {
      return { ...state, isInteractive: false };
    }
    case "SHOW_ALL_CARDS": {
      let newBoard = state.board.map((card) => ({ ...card, visible: false }));

      return { ...state, board: newBoard, isInteractive: true };
    }
    case "SUCCESS_PAIR": {
      let newBoard = [...state.board];

      newBoard[state.flippedCards[0]] = {
        ...newBoard[state.flippedCards[0]],
        present: false,
      };

      newBoard[state.flippedCards[1]] = {
        ...newBoard[state.flippedCards[1]],
        present: false,
      };

      return {
        ...state,
        board: newBoard,
        flippedCards: [],
        isInteractive: true,
      };
    }
    case "FAIL_PAIR": {
      let newBoard = [...state.board];

      newBoard[state.flippedCards[0]] = {
        ...newBoard[state.flippedCards[0]],
        visible: false,
      };

      newBoard[state.flippedCards[1]] = {
        ...newBoard[state.flippedCards[1]],
        visible: false,
      };

      return {
        ...state,
        board: newBoard,
        flippedCards: [],
        isInteractive: true,
      };
    }
    default: {
      return state;
    }
  }
}

export default function useGlobalStateReducer() {
  const randomColors = useRandomColors(POSSIBLE_COLORS, NUMBER_OF_CARDS);
  let initialBoard = randomColors.map((color) => ({
    visible: true,
    color,
    present: true,
  }));

  const [state, dispatch] = useReducer(reducer, {
    board: initialBoard,
    isInteractive: true,
    count: 0,
    flippedCards: [],
  });

  // Flip all card after some time showing them at the beginning.
  useEffect(() => {
    dispatch({ type: "DISABLE_BOARD" });

    let timeout = setTimeout(() => {
      dispatch({ type: "SHOW_ALL_CARDS" });
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  // Initiate a check if two cards are flipped.
  useEffect(() => {
    if (
      state.flippedCards.length < 2 ||
      state.flippedCards[0] === state.flippedCards[1]
    ) {
      return () => {};
    }

    // Keep the user from flipping more cards while the check happens.
    dispatch({ type: "DISABLE_BOARD" });

    let matchColors =
      state.board[state.flippedCards[0]].color ===
      state.board[state.flippedCards[1]].color;

    let timeout = setTimeout(() => {
      dispatch({ type: matchColors ? "SUCCESS_PAIR" : "FAIL_PAIR" });
    }, 800);

    return () => clearTimeout(timeout);
  }, [state.board, state.flippedCards]);

  return [state, dispatch];
}
