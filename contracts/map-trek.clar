;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-found (err u404))
(define-constant err-unauthorized (err u401))
(define-constant err-invalid-rating (err u100))

;; Data structures
(define-map trails
  { id: uint }
  {
    creator: principal,
    name: (string-utf8 100),
    description: (string-utf8 500),
    difficulty: uint,
    waypoints: (list 20 (tuple (lat int) (lng int))),
    shared-with: (list 50 principal),
    reviews: (list 100 (tuple (reviewer principal) (rating uint) (comment (string-utf8 200))))
  }
)

(define-data-var last-trail-id uint u0)

;; Public functions
(define-public (create-trail 
  (name (string-utf8 100))
  (description (string-utf8 500))
  (difficulty uint)
  (waypoints (list 20 (tuple (lat int) (lng int))))
)
  (let
    ((new-id (+ (var-get last-trail-id) u1)))
    (map-set trails
      { id: new-id }
      {
        creator: tx-sender,
        name: name,
        description: description,
        difficulty: difficulty,
        waypoints: waypoints,
        shared-with: (list),
        reviews: (list)
      }
    )
    (var-set last-trail-id new-id)
    (ok new-id)
  )
)

(define-public (share-trail
  (trail-id uint)
  (user principal)
)
  (let
    ((trail (unwrap! (map-get? trails {id: trail-id}) err-not-found)))
    (if (is-eq (get creator trail) tx-sender)
      (ok (map-set trails
        { id: trail-id }
        (merge trail { shared-with: (append (get shared-with trail) user) })
      ))
      err-unauthorized
    )
  )
)

(define-public (add-review
  (trail-id uint)
  (rating uint)
  (comment (string-utf8 200))
)
  (let
    ((trail (unwrap! (map-get? trails {id: trail-id}) err-not-found)))
    (if (> rating u5)
      err-invalid-rating
      (ok (map-set trails
        { id: trail-id }
        (merge trail {
          reviews: (append (get reviews trail)
            {reviewer: tx-sender, rating: rating, comment: comment})
        })
      ))
    )
  )
)

;; Read only functions
(define-read-only (get-trail (trail-id uint))
  (map-get? trails {id: trail-id})
)

(define-read-only (get-user-trails (user principal))
  (filter map-trails (lambda (trail)
    (is-eq (get creator trail) user)
  ))
)
