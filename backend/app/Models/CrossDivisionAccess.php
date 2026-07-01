<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CrossDivisionAccess extends Model
{
    protected $table = 'cross_division_access';

    protected $fillable = [
        'user_id', 'division_id', 'module', 'access_level', 'granted_by',
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function grantor()
    {
        return $this->belongsTo(User::class, 'granted_by');
    }
}
