import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "@/store";

/**
 * Typed version of useDispatch hook
 * Use this instead of the plain useDispatch from react-redux
 * 
 * @example
 * const dispatch = useAppDispatch();
 * dispatch(someAction());
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed version of useSelector hook
 * Use this instead of the plain useSelector from react-redux
 * 
 * @example
 * const count = useAppSelector((state) => state.counter.value);
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

