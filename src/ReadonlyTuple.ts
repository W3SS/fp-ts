/**
 * @since 2.5.0
 */
import { Applicative, Applicative2C } from './Applicative'
import { Apply2C } from './Apply'
import { Bifunctor2 } from './Bifunctor'
import { Chain2C } from './Chain'
import { ChainRec2C } from './ChainRec'
import { Comonad2 } from './Comonad'
import { Either } from './Either'
import { Foldable2 } from './Foldable'
import { identity } from './function'
import { Functor2 } from './Functor'
import { HKT } from './HKT'
import { Monad2C } from './Monad'
import { Monoid } from './Monoid'
import { Semigroup } from './Semigroup'
import { Semigroupoid2 } from './Semigroupoid'
import { PipeableTraverse2, Traversable2 } from './Traversable'
import { Extend2 } from './Extend'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

/**
 * @category destructors
 * @since 2.5.0
 */
export function fst<A, S>(sa: readonly [A, S]): A {
  return sa[0]
}

/**
 * @category destructors
 * @since 2.5.0
 */
export function snd<A, S>(sa: readonly [A, S]): S {
  return sa[1]
}

/**
 * @category combinators
 * @since 2.5.0
 */
export function swap<A, S>(sa: readonly [A, S]): readonly [S, A] {
  return [snd(sa), fst(sa)]
}

/**
 * @category instances
 * @since 2.5.0
 */
export function getApply<S>(S: Semigroup<S>): Apply2C<URI, S> {
  return {
    URI,
    _E: undefined as any,
    map: map_,
    ap: (fab, fa) => [fst(fab)(fst(fa)), S.concat(snd(fab), snd(fa))]
  }
}

const of = <S>(M: Monoid<S>) => <A>(a: A): readonly [A, S] => {
  return [a, M.empty]
}

/**
 * @category instances
 * @since 2.5.0
 */
export function getApplicative<S>(M: Monoid<S>): Applicative2C<URI, S> {
  const A = getApply(M)
  return {
    URI,
    _E: undefined as any,
    map: A.map,
    ap: A.ap,
    of: of(M)
  }
}

/**
 * @category instances
 * @since 2.5.0
 */
export function getChain<S>(S: Semigroup<S>): Chain2C<URI, S> {
  const A = getApply(S)
  return {
    URI,
    _E: undefined as any,
    map: A.map,
    ap: A.ap,
    chain: (fa, f) => {
      const [b, s] = f(fst(fa))
      return [b, S.concat(snd(fa), s)]
    }
  }
}

/**
 * @category instances
 * @since 2.5.0
 */
export function getMonad<S>(M: Monoid<S>): Monad2C<URI, S> {
  const C = getChain(M)
  return {
    URI,
    _E: undefined as any,
    map: C.map,
    ap: C.ap,
    chain: C.chain,
    of: of(M)
  }
}

// TODO: remove in v3
/**
 * @category instances
 * @since 2.5.0
 */
export function getChainRec<S>(M: Monoid<S>): ChainRec2C<URI, S> {
  const chainRec = <A, B>(a: A, f: (a: A) => readonly [Either<A, B>, S]): readonly [B, S] => {
    let result: readonly [Either<A, B>, S] = f(a)
    let acc: S = M.empty
    let s: Either<A, B> = fst(result)
    while (s._tag === 'Left') {
      acc = M.concat(acc, snd(result))
      result = f(s.left)
      s = fst(result)
    }
    return [s.right, M.concat(acc, snd(result))]
  }

  const C = getChain(M)
  return {
    URI,
    _E: undefined as any,
    map: C.map,
    ap: C.ap,
    chain: C.chain,
    chainRec
  }
}

// -------------------------------------------------------------------------------------
// non-pipeables
// -------------------------------------------------------------------------------------

const compose_: Semigroupoid2<URI>['compose'] = (ba, ae) => [fst(ba), snd(ae)]
const map_: Functor2<URI>['map'] = (ae, f) => [f(fst(ae)), snd(ae)]
const bimap_: Bifunctor2<URI>['bimap'] = (fea, f, g) => [g(fst(fea)), f(snd(fea))]
const mapLeft_: Bifunctor2<URI>['mapLeft'] = (fea, f) => [fst(fea), f(snd(fea))]
const extend_: Extend2<URI>['extend'] = (ae, f) => [f(ae), snd(ae)]
const reduce_: Foldable2<URI>['reduce'] = (ae, b, f) => f(b, fst(ae))
const foldMap_: Foldable2<URI>['foldMap'] = (_) => (ae, f) => f(fst(ae))
const reduceRight_: Foldable2<URI>['reduceRight'] = (ae, b, f) => f(fst(ae), b)
const traverse_ = <F>(F: Applicative<F>) => <A, S, B>(
  as: readonly [A, S],
  f: (a: A) => HKT<F, B>
): HKT<F, readonly [B, S]> => {
  return F.map(f(fst(as)), (b) => [b, snd(as)])
}

// -------------------------------------------------------------------------------------
// pipeables
// -------------------------------------------------------------------------------------

/**
 * Map a pair of functions over the two type arguments of the bifunctor.
 *
 * @category Bifunctor
 * @since 2.5.0
 */
export const bimap: <E, G, A, B>(f: (e: E) => G, g: (a: A) => B) => (fa: readonly [A, E]) => readonly [B, G] = (
  f,
  g
) => (fa) => bimap_(fa, f, g)

/**
 * Map a function over the first type argument of a bifunctor.
 *
 * @category Bifunctor
 * @since 2.5.0
 */
export const mapLeft: <E, G>(f: (e: E) => G) => <A>(fa: readonly [A, E]) => readonly [A, G] = (f) => (fa) =>
  mapLeft_(fa, f)

/**
 * @category Semigroupoid
 * @since 2.5.0
 */
export const compose: <E, A>(la: readonly [A, E]) => <B>(ab: readonly [B, A]) => readonly [B, E] = (la) => (ab) =>
  compose_(ab, la)

/**
 * @category Extend
 * @since 2.5.0
 */
export const duplicate: <E, A>(ma: readonly [A, E]) => readonly [readonly [A, E], E] = (ma) => extend_(ma, identity)

/**
 * @category Extend
 * @since 2.5.0
 */
export const extend: <E, A, B>(f: (fa: readonly [A, E]) => B) => (wa: readonly [A, E]) => readonly [B, E] = (f) => (
  ma
) => extend_(ma, f)

/**
 * @category Extract
 * @since 2.6.2
 */
export const extract: <E, A>(wa: readonly [A, E]) => A = fst

/**
 * @category Foldable
 * @since 2.5.0
 */
export const foldMap: <M>(M: Monoid<M>) => <A>(f: (a: A) => M) => <E>(fa: readonly [A, E]) => M = (M) => {
  const foldMapM = foldMap_(M)
  return (f) => (fa) => foldMapM(fa, f)
}

/**
 * `map` can be used to turn functions `(a: A) => B` into functions `(fa: F<A>) => F<B>` whose argument and return types
 * use the type constructor `F` to represent some computational context.
 *
 * @category Functor
 * @since 2.5.0
 */
export const map: <A, B>(f: (a: A) => B) => <E>(fa: readonly [A, E]) => readonly [B, E] = (f) => (fa) => map_(fa, f)

/**
 * @category Foldable
 * @since 2.5.0
 */
export const reduce: <A, B>(b: B, f: (b: B, a: A) => B) => <E>(fa: readonly [A, E]) => B = (b, f) => (fa) =>
  reduce_(fa, b, f)

/**
 * @category Foldable
 * @since 2.5.0
 */
export const reduceRight: <A, B>(b: B, f: (a: A, b: B) => B) => <E>(fa: readonly [A, E]) => B = (b, f) => (fa) =>
  reduceRight_(fa, b, f)

/**
 * @since 2.6.3
 */
export const traverse: PipeableTraverse2<URI> = <F>(
  F: Applicative<F>
): (<A, B>(f: (a: A) => HKT<F, B>) => <S>(as: readonly [A, S]) => HKT<F, readonly [B, S]>) => {
  return (f) => (ta) => traverse_(F)(ta, f)
}

/**
 * @since 2.6.3
 */
export const sequence: Traversable2<URI>['sequence'] = <F>(F: Applicative<F>) => <A, S>(
  fas: readonly [HKT<F, A>, S]
): HKT<F, readonly [A, S]> => {
  return F.map(fst(fas), (a) => [a, snd(fas)])
}

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

/**
 * @category instances
 * @since 2.5.0
 */
export const URI = 'ReadonlyTuple'

/**
 * @category instances
 * @since 2.5.0
 */
export type URI = typeof URI

declare module './HKT' {
  interface URItoKind2<E, A> {
    readonly [URI]: readonly [A, E]
  }
}

/**
 * @category instances
 * @since 2.7.0
 */
export const Functor: Functor2<URI> = {
  URI,
  map: map_
}

/**
 * @category instances
 * @since 2.7.0
 */
export const Bifunctor: Bifunctor2<URI> = {
  URI,
  bimap: bimap_,
  mapLeft: mapLeft_
}

/**
 * @category instances
 * @since 2.7.0
 */
export const Semigroupoid: Semigroupoid2<URI> = {
  URI,
  compose: compose_
}

/**
 * @category instances
 * @since 2.7.0
 */
export const Comonad: Comonad2<URI> = {
  URI,
  map: map_,
  extend: extend_,
  extract
}

/**
 * @category instances
 * @since 2.7.0
 */
export const Foldable: Foldable2<URI> = {
  URI,
  reduce: reduce_,
  foldMap: foldMap_,
  reduceRight: reduceRight_
}

/**
 * @category instances
 * @since 2.7.0
 */
export const Traversable: Traversable2<URI> = {
  URI,
  map: map_,
  reduce: reduce_,
  foldMap: foldMap_,
  reduceRight: reduceRight_,
  traverse: traverse_,
  sequence
}

// TODO: remove in v3
/**
 * @category instances
 * @since 2.5.0
 */
export const readonlyTuple: Semigroupoid2<URI> &
  Bifunctor2<URI> &
  Comonad2<URI> &
  Foldable2<URI> &
  Traversable2<URI> = {
  URI,
  compose: compose_,
  map: map_,
  bimap: bimap_,
  mapLeft: mapLeft_,
  extract,
  extend: extend_,
  reduce: reduce_,
  foldMap: foldMap_,
  reduceRight: reduceRight_,
  traverse: traverse_,
  sequence
}
