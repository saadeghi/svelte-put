/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import type { ComponentEvents, ComponentProps, ComponentType, SvelteComponentTyped } from 'svelte';

import type Modal from './Modal.svelte';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { createModalEventDispatcher } from './modal';

/**
 * The trigger that resolves the modal
 *
 * - `backdrop`: non-static backdrop was clicked
 *
 * - `x`: `x` button was clicked
 *
 * - `escape`: `escape` key was pressed
 *
 * - `clickoutside`: click outside of modal was detected
 *
 * - `pop`: modal was resolved from by calling the `pop` method of the modal store
 *
 * - `custom`: modal was resolved by a custom dispatch. Use this in your
 * custom modal when extending the `resolve` event with additional props.
 * See {@link ExtendedModalEvents}
 *
 * @public
 */
export type ResolveTrigger = 'backdrop' | 'x' | 'escape' | 'clickoutside' | 'pop' | 'custom';

/**
 * The base interface when modal is resolved
 * @public
 */
export type ModalComponentBaseResolved = {
  trigger: ResolveTrigger;
};

/**
 * The base events for modal
 * @public
 */
export type ModalComponentBaseProps = {};

/**
 * The base events for modal
 * @public
 */
export type ModalComponentBaseEvents<
  Resolved extends ModalComponentBaseResolved = ModalComponentBaseResolved,
> = {
  resolve: CustomEvent<Resolved>;
};

/**
 * The base slots for modal
 * @public
 */
export type ModalComponentBaseSlots = {};

/**
 * The base component for modal. Modals extending this component needs to
 * meet the specified constraints
 * @public
 */
export type ModalComponentBase = SvelteComponentTyped<
  ModalComponentBaseProps,
  ModalComponentBaseEvents<ModalComponentBaseResolved>,
  ModalComponentBaseSlots
>;

/**
 * A modal pushed to the modal store
 * @public
 */
export interface PushedModal<Component extends ModalComponentBase> {
  /** default to new uuid */
  id: string;
  /** component to render in modal layout */
  component: ComponentType<Component>;
  /** props passed to modal component */
  props: ComponentProps<Component>;
}

/**
 * Either the Svelte modal component or an interface as in {@link PushedModal}
 * with all optional props except for `component`
 * @public
 */
export type ModalPushInput<Component extends ModalComponentBase> =
  | ComponentType<Component>
  | (Partial<PushedModal<Component>> & Pick<PushedModal<Component>, 'component'>);

/**
 * The return of the `push` method of modal store
 * @public
 */
export interface ModalPushOutput<
  Component extends ModalComponentBase,
  Resolved extends ModalComponentBaseResolved = ComponentEvents<Component>['resolve']['detail'],
> {
  /**
   * id of the pushed modal, pass to `pop` to dismiss modal
   *
   * @example
   *
   * ```typescript
   * import { createModalStore } from '@svelte-put/modal';
   * const store = createModalStore();
   * const pushed = store.push({ component: SomeComponent, props: { someProp: 'value' } });
   * store.pop(pushed.id);
   * ```
   */
  id: string;
  /**
   * wait for the modal to resolve, and return the promise wrapping the resolved value
   *
   * @example
   *
   * ```typescript
   * import { createModalStore } from '@svelte-put/modal';
   * const store = createModalStore();
   * const pushed = store.push({ component: ConfirmationModal });
   * // assuming ConfirmationModal resolves with { confirmed: boolean }
   * const { confirmed } = await pushed.resolve();
   * ```
   */
  resolve: () => Promise<Resolved>;
}

/**
 * Utility type for building custom props type from the base Modal component
 * @public
 *
 * @example
 *
 * ```html
 * <script lang="ts">
 *   import Modal from '@svelte-put/modal/Modal.svelte';
 *   import type { ExtendedModalProps } from '@svelte-put/modal';
 *
 *   $$Props = ExtendedModalProps<{ anotherProp: string }>;
 *
 *   export let anotherProp: string;
 * </script>
 *
 * <Modal {...$$restProps} on:resolve>
 *   <p>{anotherProp}</p>
 * </Modal>
 * ```
 */
export type ExtendedModalProps<ExtendedProps extends Record<string, any> = {}> =
  ComponentProps<Modal> & ExtendedProps;

/**
 * Utility type for building custom events type from the base Modal component.
 * Use in conjunction with {@link createModalEventDispatcher}
 * @public
 *
 * @remarks
 *
 * When extending events, we need to create a new `dispatch` function.
 * Remember to pass this new `dispatch` as prop to the `Modal` component.
 *
 * When dispatching your extended `resolve` event, you will also need to pass
 * the `trigger` prop to the event detail. Any {@link ResolveTrigger} is valid,
 * but in this context `custom` is recommended (see example below).
 *
 * For simple no-action modal, just forward the resolve event.
 *
 * ```html
 * <script lang="ts">
 *   import Modal from '@svelte-put/modal/Modal.svelte';
 *   import type { ExtendedModalEvents, ExtendedModalProps } from '@svelte-put/modal';
 *
 *   $$Props = ExtendedModalProps;
 *   $$Events = ExtendedModalEvents;
 * </script
 * <Modal {...$$props} on:resolve>
 * ```
 *
 * @example
 *
 * Custom the base `resolve` event.
 *
 * ```html
 * <script lang="ts">
 *   import Modal from '@svelte-put/modal/Modal.svelte';
 *   import { createModalEventDispatcher } from '@svelte-put/modal;
 *   import type { ExtendedModalEvents, ExtendedModalProps } from '@svelte-put/modal';
 *
 *   $$Props = ExtendedModalProps;
 *   $$Events = ExtendedModalEvents<{
 *      confirmed: boolean;
 *   }>
 *
 *   // create type-safe dispatch function
 *   const dispatch = createModalEventDispatcher<$$Events>();
 *
 *   function resolve() {
 *     dispatch('resolve', {
 *       trigger: 'custom',
 *       confirmed: true,
 *     });
 *   }
 * </script>
 *
 * <Modal {...$$props} {dispatch}>
 *   <button type="button" on:click={() => resolve(true)}>Confirm</button>
 *   <button type="button" on:click={() => resolve(false)}>Cancel</button>
 * </Modal>
 * ```
 *
 * @example
 *
 * Add other events.
 *
 * ```html
 * <script lang="ts">
 *   import Modal from '@svelte-put/modal/Modal.svelte';
 *   import { createModalEventDispatcher } from '@svelte-put/modal;
 *   import type { ExtendedModalEvents, ExtendedModalProps } from '@svelte-put/modal';
 *
 *   $$Props = ExtendedModalProps;
 *   $$Events = ExtendedModalEvents<{}, {
 *     anotherEvent: string;
 *   }>
 *
 *   // create type-safe dispatch function
 *   const dispatch = createModalEventDispatcher<$$Events>();
 *
 *   function handleClick() {
 *     dispatch('anotherEvent', 'detail');
 *   }
 * </script>
 *
 * <Modal {...$$props} {dispatch}>
 *   <button type="button" on:click={handleClick}>Another Event</button>
 * </Modal>
 * ```
 */
export type ExtendedModalEvents<
  ExtendedResolved extends Record<string, any> = {},
  ExtendedEvents extends Record<string, CustomEvent<any>> = {},
> = {
  resolve: CustomEvent<ModalComponentBaseResolved & ExtendedResolved>;
} & ExtendedEvents;