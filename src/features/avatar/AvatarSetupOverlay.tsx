type Props = {
  poseStable: boolean
  onStartPlay: () => void
}

export function AvatarSetupOverlay({ poseStable, onStartPlay }: Props) {
  return (
    <div className="otohiroi-setup" role="dialog" aria-labelledby="otohiroi-setup-title">
      <h2 id="otohiroi-setup-title" className="otohiroi-setup__title">
        とりくみ
      </h2>
      <p className="otohiroi-setup__text">
        {poseStable
          ? 'いいね！　このまま「あそぶ！」をおしてね'
          : 'からだと手が画面に入るまで　少し下がってね'}
      </p>
      <button
        type="button"
        className="otohiroi-setup__start"
        disabled={!poseStable}
        onClick={onStartPlay}
      >
        あそぶ！
      </button>
    </div>
  )
}
